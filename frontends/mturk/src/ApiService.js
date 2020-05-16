class ApiService {
  constructor(domain) {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      //this.domain = domain || 'https://54.187.22.210:8081'
      this.domain = domain || 'https://dynabench.org:8081'
    } else {
      //this.domain = domain || 'https://54.187.22.210:8080'
      this.domain = domain || 'https://dynabench.org:8080'
    }

    this.fetch = this.fetch.bind(this)
  }

  getModelResponse(modelUrl, context, hypothesis) {
    return this.fetch(modelUrl, {
      method: 'POST',
      body: JSON.stringify(
        {'context': context, 'hypothesis': hypothesis}
      )
    }).then(res => {
      return Promise.resolve(res);
    })
  }

  retractExample(id) {
    // TODO: This needs an id check server-side, right?
    return this.fetch(`${this.domain}/examples/${id}`, {
      method: 'PUT',
      body: JSON.stringify(
        {
          'retracted': true
        }
      )
    }).then(res => {
      return Promise.resolve(res);
    })
  }

  storeExample(tid, rid, uid, cid, hypothesis, target, response) {
    return this.fetch(`${this.domain}/examples`, {
      method: 'POST',
      body: JSON.stringify(
        {
          'hypothesis': hypothesis,
          'tid': tid,
          'rid': rid,
          'cid': cid,
          'uid': uid, // MECHANICAL TURK WORKER ID
          'target': target,
          'response': response
        }
      )
    }).then(res => {
      return Promise.resolve(res);
    })
  }

  doFetch(url, options) {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'None',
    }
    return fetch(url, {
      headers,
      credentials: 'include', // not sure if we always need this?
      ...options
    })
    .then(this._checkStatus)
    .then(response => response.json());
  }

  fetch(url, options) {
    return this.doFetch(url, options);
  }

  _checkStatus(response) {
    // raises an error in case response status is not a success
    if (response.status >= 200 && response.status < 300) {
      return response
    } else {
      var error = new Error(response.statusText)
      error.response = response
      throw error
    }
  }
}
export { ApiService };
