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
      },
    },
    /**
     * Runs when this Sails app loads/lifts.
     */
    initialize: async function () {
      sails.log.info('Initializing custom hook (`treblle`)')
      const { useTreblle } = require('treblle')
      sails.after('hook:http:loaded', () => {
        useTreblle(sails.hooks.http.app, sails.config.treblle)
      })
    },
  }
}
