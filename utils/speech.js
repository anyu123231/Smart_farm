/**
 * 语音识别（输入）与朗读（输出）——按平台分支
 */

function startSpeechH5() {
	return new Promise((resolve, reject) => {
		if (typeof window === 'undefined') {
			reject(new Error('非浏览器环境'))
			return
		}
		const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
		if (!Ctor) {
			reject(new Error('当前浏览器不支持语音识别，请使用 Chrome 或 Edge，或在 App 内使用'))
			return
		}
		const rec = new Ctor()
		rec.lang = 'zh-CN'
		rec.interimResults = false
		rec.maxAlternatives = 1
		rec.onresult = (e) => {
			try {
				const text = (e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript) || ''
				resolve(String(text).trim())
			} catch (err) {
				reject(err)
			}
		}
		rec.onerror = (e) => {
			reject(new Error(e.error || '语音识别失败'))
		}
		rec.onend = () => {}
		try {
			rec.start()
		} catch (err) {
			reject(err)
		}
	})
}

function mapSpeechError(err) {
	const raw = (err && err.message) || String(err || '')
	if (
		raw.includes('-3004') ||
		raw.includes('asr authentication') ||
		raw.includes('App name unknown')
	) {
		return new Error(
			'语音识别云端鉴权失败（plus.speech 百度/讯飞）。Android 已改为系统自带识别；若仍见此提示，请更新 App 安装包。'
		)
	}
	return new Error(raw || '语音识别失败')
}

/**
 * Android：使用 startActivityForResult 启动系统语音输入界面
 */
function startSpeechAndroidActivity() {
	return new Promise((resolve, reject) => {
		if (typeof plus === 'undefined' || !plus.android) {
			reject(new Error('当前环境不支持原生语音识别'))
			return
		}

		const perms = ['android.permission.RECORD_AUDIO']
		const run = () => {
			try {
				const main = plus.android.runtimeMainActivity()
				const Intent = plus.android.importClass('android.content.Intent')
				const RecognizerIntent = plus.android.importClass('android.speech.RecognizerIntent')

				const intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
				intent.putExtra(
					RecognizerIntent.EXTRA_LANGUAGE_MODEL,
					RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
				)
				intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, 'zh-CN')
				intent.putExtra(RecognizerIntent.EXTRA_PROMPT, '请说话')

				const REQUEST_CODE_SPEECH = 1001

				main.onActivityResult = (requestCode, resultCode, data) => {
					if (requestCode !== REQUEST_CODE_SPEECH) return

					if (resultCode === -1) {
						try {
							const key = RecognizerIntent.EXTRA_RESULTS
							const arr = data.getStringArrayListExtra(key)
							if (arr && arr.size() > 0) {
								const text = String(arr.get(0) || '').trim()
								if (text) resolve(text)
								else reject(new Error('未识别到内容'))
							} else {
								reject(new Error('未识别到内容'))
							}
						} catch (e) {
							reject(new Error('解析识别结果失败'))
						}
					} else if (resultCode === 0) {
						reject(new Error('已取消'))
					} else {
						reject(new Error('语音识别失败'))
					}
				}

				main.startActivityForResult(intent, REQUEST_CODE_SPEECH)
			} catch (e) {
				reject(new Error('启动语音识别失败'))
			}
		}

		plus.android.requestPermissions(
			perms,
			function (e) {
				const deniedAlways = (e && e.deniedAlways) || []
				const deniedPresent = (e && e.deniedPresent) || []
				if (deniedAlways.length > 0) {
					reject(new Error('麦克风权限被关闭，请到系统设置中开启'))
					return
				}
				if (deniedPresent.length > 0) {
					reject(new Error('需要麦克风权限才能使用语音输入'))
					return
				}
				run()
			},
			function () {
				reject(new Error('申请麦克风权限失败'))
			}
		)
	})
}

/**
 * Android：使用 SpeechRecognizer API（备用方案）
 */
function startSpeechAndroidSystem() {
	return new Promise((resolve, reject) => {
		if (typeof plus === 'undefined' || !plus.android) {
			reject(new Error('当前环境不支持原生语音识别'))
			return
		}

		const perms = ['android.permission.RECORD_AUDIO']
		const run = () => {
			try {
				const main = plus.android.runtimeMainActivity()
				const SpeechRecognizer = plus.android.importClass('android.speech.SpeechRecognizer')
				const Intent = plus.android.importClass('android.content.Intent')
				const RecognizerIntent = plus.android.importClass('android.speech.RecognizerIntent')

				if (!SpeechRecognizer.isRecognitionAvailable(main)) {
					reject(
						new Error(
							'本机未提供语音识别（可尝试安装「Google」应用或系统语音包后再试）'
						)
					)
					return
				}

				const recognizer = SpeechRecognizer.createSpeechRecognizer(main)
				if (!recognizer) {
					reject(new Error('创建语音识别器失败，请检查系统语音服务是否可用'))
					return
				}
				let finished = false
				const done = (fn) => {
					if (finished) return
					finished = true
					try {
						recognizer.destroy()
					} catch (e) {
						// ignore
					}
					fn()
				}

				const listener = plus.android.implements('android.speech.RecognitionListener', {
					onReadyForSpeech: function () {},
					onBeginningOfSpeech: function () {},
					onRmsChanged: function () {},
					onBufferReceived: function () {},
					onEndOfSpeech: function () {},
					onError: function (error) {
						done(() => {
							const msg =
								error === 7
									? '未检测到语音，请重试'
									: error === 6
										? '语音识别服务不可用'
										: '语音识别失败(' + error + ')'
							reject(new Error(msg))
						})
					},
					onResults: function (results) {
						done(() => {
							try {
								const key = 'results_recognition'
								const arr = results.getStringArrayList(key)
								if (arr && arr.size() > 0) {
									const text = String(arr.get(0) || '').trim()
									if (text) resolve(text)
									else reject(new Error('未识别到内容'))
								} else {
									reject(new Error('未识别到内容'))
								}
							} catch (e) {
								reject(new Error(e.message || '解析识别结果失败'))
							}
						})
					},
					onPartialResults: function () {},
					onEvent: function () {}
				})

				recognizer.setRecognitionListener(listener)
				const intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
				intent.putExtra(
					RecognizerIntent.EXTRA_LANGUAGE_MODEL,
					RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
				)
				intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, 'zh-CN')
				intent.putExtra(RecognizerIntent.EXTRA_PROMPT, '请说话')
				recognizer.startListening(intent)
			} catch (e) {
				reject(new Error(e.message || '启动语音识别失败'))
			}
		}

		plus.android.requestPermissions(
			perms,
			function (e) {
				const deniedAlways = (e && e.deniedAlways) || []
				const deniedPresent = (e && e.deniedPresent) || []
				if (deniedAlways.length > 0) {
					reject(new Error('麦克风权限被关闭，请到系统设置中开启'))
					return
				}
				if (deniedPresent.length > 0) {
					reject(new Error('需要麦克风权限才能使用语音输入'))
					return
				}
				run()
			},
			function (err) {
				reject(new Error((err && err.message) || '申请麦克风权限失败'))
			}
		)
	})
}

function startSpeechApp() {
	return new Promise((resolve, reject) => {
		if (typeof plus === 'undefined') {
			reject(new Error('当前运行环境不支持语音识别'))
			return
		}
		const os = (plus.os && plus.os.name) || ''

		if (os === 'Android') {
			startSpeechAndroidActivity().then(resolve).catch((err) => {
				console.warn('语音识别方式1失败，尝试方式2:', err.message)
				startSpeechAndroidSystem().then(resolve).catch(reject)
			})
			return
		}

		if ((os === 'iOS' || os === 'iPhone') && plus.speech && plus.speech.startRecognize) {
			const opts = {
				lang: 'zh-cn',
				timeout: 60000,
				userInterface: true,
				engine: 'apple'
			}
			plus.speech.startRecognize(
				opts,
				(text) => {
					const t =
						typeof text === 'string'
							? text.trim()
							: text && text.text
								? String(text.text).trim()
								: ''
					if (t) resolve(t)
					else reject(new Error('未识别到语音内容'))
				},
				(e) => {
					reject(mapSpeechError(e))
				}
			)
			return
		}

		reject(new Error('当前系统不支持语音识别'))
	})
}

export function startSpeechRecognition() {
	// #ifdef H5
	return startSpeechH5()
	// #endif
	// #ifdef APP-PLUS
	return startSpeechApp()
	// #endif
	return Promise.reject(new Error('当前环境不支持语音识别'))
}

/** 朗读文本（H5 / App） */
export function speakText(text, lang) {
	const clean = String(text || '').replace(/\[\[DEVICE_CMD:[\s\S]*?\]\]/g, '').trim()
	if (!clean) return

	// #ifdef H5
	if (typeof window !== 'undefined' && window.speechSynthesis) {
		window.speechSynthesis.cancel()
		const u = new SpeechSynthesisUtterance(clean)
		u.lang = lang === 'en' ? 'en-US' : 'zh-CN'
		window.speechSynthesis.speak(u)
	}
	// #endif

	// #ifdef APP-PLUS
	if (typeof plus !== 'undefined' && plus.speech && plus.speech.startSpeaking) {
		plus.speech.startSpeaking(
			{
				content: clean,
				lang: lang === 'en' ? 'en-us' : 'zh-cn'
			},
			() => {},
			() => {}
		)
	}
	// #endif
}

export function stopSpeaking() {
	// #ifdef H5
	if (typeof window !== 'undefined' && window.speechSynthesis) {
		window.speechSynthesis.cancel()
	}
	// #endif
	// #ifdef APP-PLUS
	if (typeof plus !== 'undefined' && plus.speech && plus.speech.stopSpeaking) {
		plus.speech.stopSpeaking()
	}
	// #endif
}
