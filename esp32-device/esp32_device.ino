#include <WiFi.h>
#include <PubSubClient.h>

// ========== 配置区域 ==========
const char* ssid = "你的WiFi名称";
const char* password = "WiFi密码";
const char* uid = "你的巴法云私钥";  // 巴法云私钥（16位字符串）
const char* topic = "001";            // 设备主题

// ESP32 内置LED灯引脚
#define LED1_PIN 12  // L12
#define LED2_PIN 13  // L13
// ==============================

const char* mqtt_server = "bemfa.com";
const int mqtt_port = 9501;

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000;

// 灯的状态
bool led1Status = false;
bool led2Status = false;

void setup() {
  Serial.begin(115200);
  
  // 初始化LED引脚
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  
  connectWiFi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  sendHeartbeat();
}

void connectWiFi() {
  Serial.print("连接WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi已连接，IP: ");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("连接巴法云...");
    
    // 巴法云TCP连接：clientId用UID，用户名密码留空
    // 或者clientId随意，用户名用UID
    String clientId = "ESP32-" + String(random(0xffff), HEX);
    
   //方式1：UID作为clientId
  if (client.connect(uid)) {
    
    // 方式2：UID作为用户名
    //if (client.connect(clientId.c_str(), uid, "")) {
      Serial.println("已连接");
      client.subscribe(topic);
      Serial.print("已订阅: ");
      Serial.println(topic);
      client.publish(topic, "heartbeat");
    } else {
      Serial.print("失败，状态码: ");
      Serial.print(client.state());
      Serial.println("，5秒后重试");
      delay(5000);
    }
  }
}

void sendHeartbeat() {
  unsigned long now = millis();
  if (now - lastHeartbeat > HEARTBEAT_INTERVAL) {
    client.publish(topic, "heartbeat");
    lastHeartbeat = now;
    Serial.println(">>> 发送心跳");
  }
}

void callback(char* receivedTopic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  
  Serial.print("收到指令: ");
  Serial.println(msg);
  
  // 单灯控制
  if (msg == "on") {
    digitalWrite(LED1_PIN, HIGH);
    led1Status = true;
    Serial.println("L12 已打开");
    
  } else if (msg == "off") {
    digitalWrite(LED1_PIN, LOW);
    led1Status = false;
    Serial.println("L12 已关闭");
    
  // 双灯控制（类型2设备）
  } else if (msg == "left") {
    digitalWrite(LED1_PIN, HIGH);
    digitalWrite(LED2_PIN, LOW);
    led1Status = true;
    led2Status = false;
    Serial.println("L12开, L13关");
    
  } else if (msg == "right") {
    digitalWrite(LED1_PIN, LOW);
    digitalWrite(LED2_PIN, HIGH);
    led1Status = false;
    led2Status = true;
    Serial.println("L12关, L13开");
    
  } else if (msg == "full") {
    digitalWrite(LED1_PIN, HIGH);
    digitalWrite(LED2_PIN, HIGH);
    led1Status = true;
    led2Status = true;
    Serial.println("L12开, L13开");
    
  } else if (msg == "close") {
    digitalWrite(LED1_PIN, LOW);
    digitalWrite(LED2_PIN, LOW);
    led1Status = false;
    led2Status = false;
    Serial.println("L12关, L13关");
  }
}
