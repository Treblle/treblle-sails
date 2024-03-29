const {
  generateFieldsToMask,
  maskSensitiveValues,
  generateTrebllePayload,
  getRequestDuration,
  sendPayloadToTreblle,
  getResponsePayload,
} = require('@treblle/utils')

const { version: sdkVersion } = require('../package.json')

module.exports = function treblleMiddleware(req, res, next) {
  // Track when this request was received.
  const requestStartTime = process.hrtime()

  const sails = req._sails

  // Intercept response body
  const originalSend = res.send
  res.send = function sendOverWrite(body) {
    originalSend.call(this, body)
    this._treblleResponsebody = body
  }

  // Now bind a one-time listener that will fire when the request is finished.
  res.on('finish', function onceFinish() {
    let errors = []
    const body = req.body || {}
    const query = req.query || {}
    const requestPayload = { ...body, ...query }

    const fieldsToMask = generateFieldsToMask(
      sails.config.treblle.additionalFieldsToMask
    )
    const maskedRequestPayload = maskSensitiveValues(
      requestPayload,
      fieldsToMask
    )

    const protocol = `${req.protocol}/${req.httpVersion}`

    const { payload: maskedResponseBody, error: invalidResponseBodyError } =
      getResponsePayload(res._treblleResponsebody, fieldsToMask)

    if (invalidResponseBodyError) {
      errors.push(invalidResponseBodyError)
    }

    // Treblle Payload
    const trebllePayload = generateTrebllePayload(
      {
        api_key: sails.config.treblle.apiKey,
        project_id: sails.config.treblle.projectId,
        sdk: 'sails',
        version: sdkVersion,
      },
      {
        server: {
          protocol,
        },
        request: {
          ip: req.ip,
          url: `${req.protocol}://${req.headers['host']}${req.url}`,
          user_agent: req.headers['user-agent'],
          method: req.method,
          headers: maskSensitiveValues(req.headers, fieldsToMask),
          body: maskedRequestPayload,
        },
        response: {
          headers: maskSensitiveValues(res.getHeaders(), fieldsToMask),
          code: res.statusCode,
          size: res.get('content-length'),
          load_time: getRequestDuration(requestStartTime),
          body: maskedResponseBody,
        },
        errors,
      }
    )

    try {
      sendPayloadToTreblle(trebllePayload, sails.config.treblle.apiKey)
    } catch (error) {
      sails.log(error)
    }
  })

  return next()
}
