/* Axios shoud be bundle through `npm install axios` */
const axios = require('axios');
const preprod = axios.create({
  method: 'post',
  baseURL: 'https://preprod.api.catalizr.io/',
  timeout: 1000
});

const crypto = require('crypto');

class Auth {

  headers = {};
  privateKey = null;

  constructor(){
    if(process.env.PRIVATE_KEY) this.privateKey = process.env.PRIVATE_KEY;
    else throw new Error ('Your private key is unreadable. No auth possible.');
  }

  generateNOnce() {
    /* Some logic to get the previous NOnce */
    /* Some logic to increment it */
    const NOnce = 1;
    if (NOnce > 0) return NOnce;
    else throw new Error('NOnce is not a positive integer. Please check your logic.');
  }

  generateHmac (nonce, url, body) {
    if(!url || !body) throw new Error('url or body parameters is missing');

    const secret = this.privateKey + nonce + url + body;
    const hmac = crypto.createHmac('sha256', secret);
    const generation = null;

    hmac.on('readable', () => {
      const data = hmac.read();
      if (data) generation = data.toString('hex');
      else throw new Error('crypto failed at generating the hmac');
    });

    hmac.write('some data to hash');
    hmac.end();

    return generation;
  }

  async makeTheCall(url, data) {
    try {
      const nonce = this.generateNOnce();
      const response = await preprod({
        url: url,
        data,
        headers: {
          'x-api-nonce': nonce,
          'x-api-signature': this.generateHmac(url, data, nonce)
        }
      });

      return response;

    } catch (error) {
      throw new Error(error);
    }
  }
  
  authorize(apiPublicKey) {
    if(!apiPublicKey) throw new Error('Please provide your public Key.');

    const url = '/authorize';
    const data = {
      apiPublicKey
    };

    const token = this.makeTheCall(url, data);
    return token;

  }

  authorizePasswordRequest(email, http) {
    if(!email || !http) throw new Error ('One or more parameter(s) is missing.');
    
    const url = '/authorize/password/request';
    const data = {
      "email": email,
      "redirection_url": http
    }

    const request = await this.makeTheCall(url, data);

    if(request) return http;
    else return false;

  }

  authorizePasswordReset(apiPublicKey, email) {
    if (!email || !apiPublicKey) throw new Error('One or more parameter(s) is missing.');
    
    const url = '/authorize/password/reset';
    const data = {
      'email': email,
      'token': this.authorize(apiPublicKey)
    }

    const request = await this.makeTheCall(url, data);
    return request;

  }
}

export default Auth;
