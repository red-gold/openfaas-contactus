//
// Adpated from https://github.com/openfaas/openfaas-cloud/blob/master/dashboard/of-cloud-dashboard/handler.js
// Copyright (c) 2016-2019 Alex Ellis
// Copyright (c) 2018-2019 OpenFaaS Author(s)
//
'use strict'
const fs = require('fs')
module.exports = async (event, context) => {

  const { method, path, query } = event;

  if (method !== 'GET') {
    return context.status(405).fail('Method not allowed');
  }

  if (/^\/logout\/?$/.test(path)) {
    return handleLogout(context);
  }

  let headers = {
    'Content-Type': '',
  };
  if (/.*\.js/.test(path)) {
    headers['Content-Type'] = 'application/javascript';
  } else if (/.*\.jpg/.test(path)) {
    headers['Content-Type'] = 'image/jpeg';
  } else if (/.*\.css/.test(path)) {
    headers['Content-Type'] = 'text/css';
  } else if (/.*\.svg/.test(path)) {
    headers['Content-Type'] = 'image/svg+xml';
  } else if (/.*\.png/.test(path)) {
    headers['Content-Type'] = 'image/x-icon';
  } else if (/.*\.ico/.test(path)) {
    headers['Content-Type'] = 'image/x-icon';
  } else if (/.*\.json/.test(path)) {
    headers['Content-Type'] = 'application/json';
  } else if (/.*\.map/.test(path)) {
    headers['Content-Type'] = 'application/octet-stream';
  }
  let contentPath = `${__dirname}/ui${path}`;

  if (!headers['Content-Type']) {
    contentPath = `${__dirname}/ui/index.html`;
  }


  let fileData = ""
  try {
    fileData = fs.readFileSync(contentPath);
  } catch (err) {
    return context
      .headers(headers)
      .status(500)
      .fail(err);
  }


  let content = fileData.toString();

  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'text/html';
  }

  const { base_href } = process.env;

  content = content.replace(/__BASE_HREF__/g, base_href);
  return context
    .headers(headers)
    .status(200)
    .succeed(content);

}

