/**
 * @license
 * Copyright 2012 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Loading and saving blocks and code using cloud storage.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

goog.provide('BlocklyStorage');

goog.require('BlocklyGames');


/**
 * Function to get the code from Blockly or from the JS editor.
 * @type Function
 */
BlocklyStorage.getCode = null;

/**
 * Function to set the code to Blockly or to the JS editor.
 * @type Function
 */
BlocklyStorage.setCode = null;

/**
 * Function to start monitoring for changes in Blockly or in the JS editor.
 * @type Function
 */
BlocklyStorage.monitorChanges = null;

/**
 * Save blocks or JavaScript to database and return a link containing the key.
 */
BlocklyStorage.link = function() {
  var code = BlocklyStorage.getCode();
  BlocklyStorage.makeRequest('/storage', 'xml=' + encodeURIComponent(code),
      BlocklyStorage.handleLinkResponse_);
};

/**
 * Retrieve XML text from database using given key.
 * @param {string} key Key to XML, obtained from href.
 */
BlocklyStorage.retrieveXml = function(key) {
  BlocklyStorage.makeRequest('/storage', 'key=' + encodeURIComponent(key),
      BlocklyStorage.handleRetrieveXmlResponse_);
};

/**
 * Global reference to current AJAX requests.
 * @type Object.<string, XMLHttpRequest>
 */
BlocklyStorage.xhrs_ = {};

/**
 * Fire a new AJAX request.
 * @param {string} url URL to fetch.
 * @param {string} data Body of data to be sent in request.
 * @param {?Function=} opt_onSuccess Function to call after request completes
 *    successfully.
 * @param {?Function=} opt_onFailure Function to call after request completes
 *    unsuccessfully. Defaults to BlocklyStorage alert of request status.
 * @param {string=} [opt_method='POST'] The HTTP request method to use.
 */
BlocklyStorage.makeRequest =
    function(url, data, opt_onSuccess, opt_onFailure, opt_method) {
  if (BlocklyStorage.xhrs_[url]) {
    // AJAX call is in-flight.
    BlocklyStorage.xhrs_[url].abort();
  }
  BlocklyStorage.xhrs_[url] = new XMLHttpRequest();
  BlocklyStorage.xhrs_[url].onload = function() {
    if (this.status >= 200 && this.status < 300) {
      opt_onSuccess && opt_onSuccess.call(this);
    } else if (opt_onFailure) {
      opt_onFailure.call(this);
    } else {
      BlocklyStorage.alert(BlocklyGames.getMsg('Games_httpRequestError') +
          '\nXHR status: ' + this.status);
    }
    BlocklyStorage.xhrs_[url] = null;
  };
  var method = opt_method || 'POST';
  BlocklyStorage.xhrs_[url].open(method, url);
  if (method === 'POST') {
    BlocklyStorage.xhrs_[url].setRequestHeader('Content-Type',
        'application/x-www-form-urlencoded');
  }
  BlocklyStorage.xhrs_[url].send(data);
};

/**
 * Callback function for link AJAX call.
 * @param {string} responseText Response to request.
 * @private
 */
BlocklyStorage.handleLinkResponse_ = function() {
  var data = this.responseText.trim();
  window.location.hash = data;
  BlocklyStorage.alert(BlocklyGames.getMsg('Games_linkAlert').replace('%1',
      window.location.href));
  BlocklyStorage.monitorChanges();
};

/**
 * Callback function for retrieve XML AJAX call.
 * @param {string} responseText Response to request.
 * @private
 */
BlocklyStorage.handleRetrieveXmlResponse_ = function() {
  var data = this.responseText.trim();
  if (!data.length) {
    BlocklyStorage.alert(BlocklyGames.getMsg('Games_hashError').replace('%1',
        window.location.hash));
  } else {
    BlocklyStorage.setCode(data);
  }
  BlocklyStorage.monitorChanges();
};

/**
 * Present a text message modally to the user.
 * @param {string} message Text to alert.
 */
BlocklyStorage.alert = function(message) {
  // Try to use a nice dialog.
  // Fall back to browser's alert() if BlocklyDialogs is not part of build.
  if (typeof BlocklyDialogs === 'object') {
    var linkButton = document.getElementById('linkButton');
    BlocklyDialogs.storageAlert(linkButton, message);
  } else {
    alert(message);
  }
};
