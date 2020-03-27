import decode from 'jwt-decode';

function delay(t, v) {
   return new Promise(function(resolve) {
       setTimeout(resolve.bind(null, v), t)
   });
}

export default class ApiService {
    constructor(domain) {
        this.domain = domain || 'http://54.185.202.254:8080'
        this.fetch = this.fetch.bind(this)
        this.setToken = this.setToken.bind(this)
        this.getToken = this.getToken.bind(this)
        this.login = this.login.bind(this)
        this.register = this.register.bind(this)
        this.getProfile = this.getProfile.bind(this)
        this.updating_already = false;
    }

    login(email, password) {
        return this.fetch(`${this.domain}/authenticate`, {
            method: 'POST',
            body: JSON.stringify(
              {'email': email, 'password': password}
            )
        }).then(res => {
            this.setToken(res.token)
            return Promise.resolve(res);
        })
    }

    register(email, password, username) {
        return this.fetch(`${this.domain}/users`, {
            method: 'POST',
            body: JSON.stringify(
              {'email': email, 'password': password, 'username': username}
            )
        }).then(res => {
            this.setToken(res.token)
            return Promise.resolve(res);
        })
    }

    getUsers() {
      return this.fetch(`${this.domain}/users`, {
        method: 'GET'
      }).then(res => {
        return Promise.resolve(res);
      })
    }

    getTasks() {
      return this.fetch(`${this.domain}/tasks`, {
        method: 'GET'
      }).then(res => {
        return Promise.resolve(res);
      })
    }

    getUser(id) {
      return this.fetch(`${this.domain}/users/${id}`, {
        method: 'GET'
      }).then(res => {
        return Promise.resolve(res);
      })
    }

    getTask(id) {
      return this.fetch(`${this.domain}/tasks/${id}`, {
        method: 'GET'
      }).then(res => {
        return Promise.resolve(res);
      })
    }

    getRandomContext(tid, rid) {
      return this.fetch(`${this.domain}/contexts/${tid}/${rid}`, {
        method: 'GET'
      }).then(res => {
        return Promise.resolve(res);
      })
    }

    loggedIn() {
        // Checks if there is a saved token and it's still valid
        const token = this.getToken() // GEtting token from localstorage
        return !!token && !this.isTokenExpired(token) // handwaiving here
    }

    isTokenExpired(token) {
        try {
            const decoded = decode(token);
            if (decoded.exp < Date.now() / 1000) { // Checking if token is expired. N
                return true;
            }
            else
                return false;
        }
        catch (err) {
            return false;
        }
    }

    setToken(idToken) {
        // Saves user token to localStorage
        localStorage.setItem('id_token', idToken)
    }

    getToken() {
        // Retrieves the user token from localStorage
        return localStorage.getItem('id_token')
    }

    logout() {
        // Clear user token and profile data from localStorage
        localStorage.removeItem('id_token');
    }

    getProfile() {
        // Using jwt-decode npm package to decode the token
        return decode(this.getToken());
    }


    fetch(url, options) {
      const token = this.getToken();
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': token ? ('Bearer ' + token ) : 'None',
      }

      // TODO: Turn this into its own function
      if (!!token && this.isTokenExpired(token) && url !== `${this.domain}/authenticate`) {
        if (!this.updating_already) {
          this.updating_already = true;
          return fetch(`${this.domain}/authenticate/refresh`, {
            method: 'GET', headers,
            credentials: 'include' // so that we send the token cookie along
          })
          .then(response => response.json())
          .then(result => {
            this.setToken(result.token);
            headers['Authorization'] = 'Bearer ' + this.getToken();
            return fetch(url, {
              headers,
              credentials: 'include', // not sure if we always need this?
              ...options
            })
            .then(this._checkStatus)
            .then(response => {
              this.updating_already = false;
              return response.json()
            })
          });
        } else {
          return delay(1000).then(() => {
            // wait a bit so that we'll have the new token - ugly I know
            headers['Authorization'] = 'Bearer ' + this.getToken();
            return fetch(url, {
              headers,
              credentials: 'include', // not sure if we always need this?
              ...options
            })
            .then(this._checkStatus)
            .then(response => {
              return response.json()
            })
          });
        }
      } else {
        return fetch(url, {
          headers,
          credentials: 'include', // not sure if we always need this?
          ...options
        })
        .then(this._checkStatus)
        .then(response => response.json())
      }
    }

    _checkStatus(response) {
        // raises an error in case response status is not a success
        if (response.status >= 200 && response.status < 300) { // Success status lies between 200 to 300
            return response
        } else {
            var error = new Error(response.statusText)
            error.response = response
            throw error
        }
    }
}
