const { sendPayloadToTreblle } = require('@treblle/utils')
const treblleMiddleware = require('./private/treblle-middleware')

/**
 * treblle hook
 *
 * @description :: A hook definition.  Extends Sails by adding shadow routes, implicit actions, and/or initialization logic.
 * @docs        :: https://sailsjs.com/docs/concepts/extending-sails/hooks
 */
module.exports = function defineTreblleHook(sails) {
  return {
    defaults: {
      treblle: {
        apiKey: sails.config.treblle?.apiKey || process.env.TREBLLE_API_KEY,
        projectId:
          sails.config.treblle?.projectId || process.env.TREBLLE_PROJECT_ID,
        routesToMonitor: [
          'GET r|^((?![^?]*\\/[^?\\/]+\\.[^?\\/]+(\\?.*)?).)*$|',
          // (^^Leave out assets)
          'POST /*',
          'PATCH /*',
          'PUT /*',
          'DELETE /*',
        ],
        additionalFieldsToMask: [],
      },
    },
    /**
     * Runs when this Sails app loads/lifts.
     */
    initialize: async function () {
      sails.log.info(
        'Initializing custom hook (`treblle`). Requests to monitored routes will be sent to Treblle...'
      )
      // Listen for when the router in Sails says it's time to bind "before" shadow routes:
      sails.on('router:before', function routerBefore() {
        sails.config.treblle.routesToMonitor.forEach(function iterator(
          routeAddress
        ) {
          sails.router.bind(routeAddress, treblleMiddleware)
        })
      })
    },
  }
}
