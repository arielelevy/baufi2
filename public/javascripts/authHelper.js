var clientId = process.env.OAUTH_APP_ID;
var clientSecret = process.env.OAUTH_APP_PASSWORD;
var redirectUri = process.env.OAUTH_REDIRECT_URI;

var scopes = [
  'openid',
  'profile',
  'offline_access',
  'https://graph.microsoft.com/Calendars.ReadWrite',
  'https://graph.microsoft.com/User.ReadBasic.All'
];

var credentials = {
  client:{
    id: clientId,
    secret: clientSecret
  },
  auth:{
    tokenHost: 'https://login.microsoftonline.com/',
    authorizePath: '/common/oauth2/v2.0/authorize',
    tokenPath: '/common/oauth2/v2.0/token'
  }
}
var oauth2 = require('simple-oauth2').create(credentials)

module.exports = {

  botHelped:"",

  getAuthUrl: function(callback) {
    var returnVal = oauth2.authorizationCode.authorizeURL({
      redirect_uri: redirectUri,
      scope: scopes.join(' ')
    });
    accionRetomar = callback;
    return returnVal;
  },

  getTokenFromCode: async function(auth_code, request, response) {
    try{
      const result =  await oauth2.authorizationCode.getToken({
        code: auth_code,
        redirect_uri: redirectUri,
        scope: scopes.join(' ')
      });
      const token = oauth2.accessToken.create(result);
      token.email = this.getEmailFromIdToken(token.token.id_token);
      this.botHelped.token = token;
      response.redirect(`https://api.whatsapp.com/send?phone=${this.botHelped.to}&text=%20`);
      this.botHelped.retomarDecisionAction();
    }catch(error){
      console.log(error);
      throw error;
    }
  },

  getEmailFromIdToken: function(id_token) {
    // JWT is in three parts, separated by a '.'
    var token_parts = id_token.split('.');

    // Token content is in the second part, in urlsafe base64
    var encoded_token = new Buffer(token_parts[1].replace('-', '+').replace('_', '/'), 'base64');

    var decoded_token = encoded_token.toString();

    var jwt = JSON.parse(decoded_token);

    // Email is in the preferred_username field
    return jwt.preferred_username
  },

  getTokenFromRefreshToken: function(token, callback, request, response) {
    //var token = oauth2.accessToken.create({ refresh_token: refresh_token, expires_in: 0});
    token.refresh(function(error, result) {
      if (error) {
        callback(request, response, error, null);
      }
      else {
        callback(request, response, null, result);
      }
    });
  }
};
