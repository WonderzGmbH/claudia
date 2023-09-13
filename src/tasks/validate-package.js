const path = require('path');
const validAuthType = require('../util/valid-auth-type');
const validCredentials = require('../util/valid-credentials');

const CURRENT_API_VERSION = 4;

//
//
module.exports = async function validatePackage(
  dir,
  functionHandler,
  hadlerFileExtension,
  restApiModule
) {
  'use strict';
  const handlerComponents = functionHandler?.split('.');
  let apiModulePath = handlerComponents?.[0],
    handlerMethod = handlerComponents?.[1],
    apiModule,
    apiConfig;
  if (restApiModule) {
    apiModulePath = restApiModule;
    handlerMethod = 'proxyRouter';
  }
  try {
    const handlerPath = path.join(dir, `${apiModulePath}.${hadlerFileExtension}`);
    if (hadlerFileExtension === 'js') {
      apiModule = require(handlerPath);
    } else {
      apiModule = await import(handlerPath);
    }
  } catch (e) {
    console.error(e.stack || e);
    throw `cannot require ./${apiModulePath} after clean installation. Check your dependencies.`;
  }
  if (!apiModule[handlerMethod]) {
    if (restApiModule) {
      throw `${apiModulePath}.${hadlerFileExtension} does not export a Claudia API Builder instance`;
    } else {
      throw `${apiModulePath}.${hadlerFileExtension} does not export method ${handlerMethod}`;
    }
  }
  if (restApiModule) {
    try {
      apiConfig = apiModule?.apiConfig();
    } catch (e) {
      throw `${apiModulePath}.${hadlerFileExtension} does not configure any API methods -- loading error`;
    }
    if (!apiConfig || !apiConfig.routes || !Object.keys(apiConfig.routes).length) {
      throw `${apiModulePath}.${hadlerFileExtension} does not configure any API methods`;
    }
    if (apiConfig.version < CURRENT_API_VERSION) {
      throw `${apiModulePath}.${hadlerFileExtension} uses an unsupported API version. Upgrade your claudia-api-builder or claudia-bot-builder dependency`;
    }
    if (apiConfig.version > CURRENT_API_VERSION) {
      throw `${apiModulePath}.${hadlerFileExtension} requires a newer version of claudia. Upgrade your claudia installation`;
    }

    Object.keys(apiConfig.routes).forEach((route) => {
      const routeConfig = apiConfig.routes[route];
      Object.keys(routeConfig).forEach((method) => {
        const methodConfig = routeConfig[method],
          routeMessage = apiModulePath + `.${hadlerFileExtension} ` + method + ' /' + route + ' ';
        if (methodConfig.success && methodConfig.success.headers) {
          if (Object.keys(methodConfig.success.headers).length === 0) {
            throw routeMessage + 'requests custom headers but does not enumerate any headers';
          }
        }
        if (methodConfig.error && methodConfig.error.headers) {
          if (Object.keys(methodConfig.error.headers).length === 0) {
            throw (
              routeMessage +
              'error template requests custom headers but does not enumerate any headers'
            );
          }
          if (Array.isArray(methodConfig.error.headers)) {
            throw (
              routeMessage + 'error template requests custom headers but does not provide defaults'
            );
          }
        }
        if (
          methodConfig.customAuthorizer &&
          (!apiConfig.authorizers || !apiConfig.authorizers[methodConfig.customAuthorizer])
        ) {
          throw (
            routeMessage +
            'requests an undefined custom authorizer ' +
            methodConfig.customAuthorizer
          );
        }
        if (
          methodConfig.cognitoAuthorizer &&
          (!apiConfig.authorizers || !apiConfig.authorizers[methodConfig.cognitoAuthorizer])
        ) {
          throw (
            routeMessage +
            'requests an undefined Cognito User Pools authorizer ' +
            methodConfig.cognitoAuthorizer
          );
        }
        if (methodConfig.authorizationType && !validAuthType(methodConfig.authorizationType)) {
          throw (
            routeMessage + 'authorization type ' + methodConfig.authorizationType + ' is invalid'
          );
        }
        if (
          methodConfig.authorizationType &&
          methodConfig.authorizationType !== 'CUSTOM' &&
          methodConfig.customAuthorizer
        ) {
          throw (
            routeMessage +
            'authorization type ' +
            methodConfig.authorizationType +
            ' is incompatible with custom authorizers'
          );
        }
        if (
          methodConfig.invokeWithCredentials &&
          !validCredentials(methodConfig.invokeWithCredentials)
        ) {
          throw routeMessage + 'credentials have to be either an ARN or a boolean';
        }
        if (
          methodConfig.authorizationType &&
          methodConfig.authorizationType !== 'AWS_IAM' &&
          methodConfig.invokeWithCredentials
        ) {
          throw (
            routeMessage +
            'authorization type ' +
            methodConfig.authorizationType +
            ' is incompatible with invokeWithCredentials'
          );
        }
        if (!methodConfig.cognitoAuthorizer && methodConfig.authorizationScopes) {
          throw routeMessage + 'authorizer is incompatible with authorizationScopes';
        }
        if (methodConfig.authorizationScopes && !Array.isArray(methodConfig.authorizationScopes)) {
          throw routeMessage + "method parameter 'authorizationScopes' must be an array";
        }
      });
    });
    if (apiConfig.authorizers) {
      Object.keys(apiConfig.authorizers).forEach((authorizerName) => {
        const authorizer = apiConfig.authorizers[authorizerName],
          authorizerMessage =
            apiModulePath + `.${hadlerFileExtension} authorizer ` + authorizerName + ' ';
        if (!authorizer.lambdaName && !authorizer.lambdaArn && !authorizer.providerARNs) {
          throw authorizerMessage + 'requires either lambdaName or lambdaArn or providerARNs';
        }
        if (authorizer.lambdaName && authorizer.lambdaArn) {
          throw authorizerMessage + 'is ambiguous - both lambdaName or lambdaArn are defined';
        }
        if (
          authorizer.lambdaVersion &&
          typeof authorizer.lambdaVersion !== 'boolean' &&
          typeof authorizer.lambdaVersion !== 'string'
        ) {
          throw authorizerMessage + 'lambdaVersion must be either string or true';
        }
        if (authorizer.lambdaVersion && authorizer.lambdaArn) {
          throw authorizerMessage + 'is ambiguous - cannot use lambdaVersion with lambdaArn';
        }
      });
    }
  }
  return dir;
};
