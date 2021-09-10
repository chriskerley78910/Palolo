/**
 * @license Proprietary text 2.0.15 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/text/LICENSE
 */
/*jslint regexp: true */
/*global require, XMLHttpRequest, ActiveXObject,
  define, window, process, Packages,
  java, location, components, FileUtils */

define('text',['module'], function (module) {
    'use strict';

    var text, fs, Cc, Ci, xpcIsWindows,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = {},
        masterConfig = (module.config && module.config()) || {};

    function useDefault(value, defaultValue) {
        return value === undefined || value === '' ? defaultValue : value;
    }

    //Allow for default ports for http and https.
    function isSamePort(protocol1, port1, protocol2, port2) {
        if (port1 === port2) {
            return true;
        } else if (protocol1 === protocol2) {
            if (protocol1 === 'http') {
                return useDefault(port1, '80') === useDefault(port2, '80');
            } else if (protocol1 === 'https') {
                return useDefault(port1, '443') === useDefault(port2, '443');
            }
        }
        return false;
    }

    text = {
        version: '2.0.15',

        strip: function (content) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (content) {
                content = content.replace(xmlRegExp, "");
                var matches = content.match(bodyRegExp);
                if (matches) {
                    content = matches[1];
                }
            } else {
                content = "";
            }
            return content;
        },

        jsEscape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
        },

        createXhr: masterConfig.createXhr || function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject !== "undefined") {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            return xhr;
        },

        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext!strip, where the !strip part is
         * optional.
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext" and "strip"
         * where strip is a boolean.
         */
        parseName: function (name) {
            var modName, ext, temp,
                strip = false,
                index = name.lastIndexOf("."),
                isRelative = name.indexOf('./') === 0 ||
                             name.indexOf('../') === 0;

            if (index !== -1 && (!isRelative || index > 1)) {
                modName = name.substring(0, index);
                ext = name.substring(index + 1);
            } else {
                modName = name;
            }

            temp = ext || modName;
            index = temp.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = temp.substring(index + 1) === "strip";
                temp = temp.substring(0, index);
                if (ext) {
                    ext = temp;
                } else {
                    modName = temp;
                }
            }

            return {
                moduleName: modName,
                ext: ext,
                strip: strip
            };
        },

        xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

        /**
         * Is an URL on another domain. Only works for browser use, returns
         * false in non-browser environments. Only used to know if an
         * optimized .js version of a text resource should be loaded
         * instead.
         * @param {String} url
         * @returns Boolean
         */
        useXhr: function (url, protocol, hostname, port) {
            var uProtocol, uHostName, uPort,
                match = text.xdRegExp.exec(url);
            if (!match) {
                return true;
            }
            uProtocol = match[2];
            uHostName = match[3];

            uHostName = uHostName.split(':');
            uPort = uHostName[1];
            uHostName = uHostName[0];

            return (!uProtocol || uProtocol === protocol) &&
                   (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) &&
                   ((!uPort && !uHostName) || isSamePort(uProtocol, uPort, protocol, port));
        },

        finishLoad: function (name, strip, content, onLoad) {
            content = strip ? text.strip(content) : content;
            if (masterConfig.isBuild) {
                buildMap[name] = content;
            }
            onLoad(content);
        },

        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            // Do not bother with the work if a build and text will
            // not be inlined.
            if (config && config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config && config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName +
                    (parsed.ext ? '.' + parsed.ext : ''),
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                         text.useXhr;

            // Do not load if it is an empty: url
            if (url.indexOf('empty:') === 0) {
                onLoad();
                return;
            }

            //Load the text. Use XHR if possible and in a browser.
            if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                text.get(url, function (content) {
                    text.finishLoad(name, parsed.strip, content, onLoad);
                }, function (err) {
                    if (onLoad.error) {
                        onLoad.error(err);
                    }
                });
            } else {
                //Need to fetch the resource across domains. Assume
                //the resource has been optimized into a JS module. Fetch
                //by the module name + extension, but do not include the
                //!strip part to avoid file system issues.
                req([nonStripName], function (content) {
                    text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                                    parsed.strip, content, onLoad);
                });
            }
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = text.jsEscape(buildMap[moduleName]);
                write.asModule(pluginName + "!" + moduleName,
                               "define(function () { return '" +
                                   content +
                               "';});\n");
            }
        },

        writeFile: function (pluginName, moduleName, req, write, config) {
            var parsed = text.parseName(moduleName),
                extPart = parsed.ext ? '.' + parsed.ext : '',
                nonStripName = parsed.moduleName + extPart,
                //Use a '.js' file name so that it indicates it is a
                //script that can be loaded across domains.
                fileName = req.toUrl(parsed.moduleName + extPart) + '.js';

            //Leverage own load() method to load plugin value, but only
            //write out values that do not have the strip argument,
            //to avoid any potential issues with ! in file names.
            text.load(nonStripName, req, function (value) {
                //Use own write() method to construct full module value.
                //But need to create shell that translates writeFile's
                //write() to the right interface.
                var textWrite = function (contents) {
                    return write(fileName, contents);
                };
                textWrite.asModule = function (moduleName, contents) {
                    return write.asModule(moduleName, fileName, contents);
                };

                text.write(pluginName, nonStripName, textWrite, config);
            }, config);
        }
    };

    if (masterConfig.env === 'node' || (!masterConfig.env &&
            typeof process !== "undefined" &&
            process.versions &&
            !!process.versions.node &&
            !process.versions['node-webkit'] &&
            !process.versions['atom-shell'])) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback, errback) {
            try {
                var file = fs.readFileSync(url, 'utf8');
                //Remove BOM (Byte Mark Order) from utf8 files if it is there.
                if (file[0] === '\uFEFF') {
                    file = file.substring(1);
                }
                callback(file);
            } catch (e) {
                if (errback) {
                    errback(e);
                }
            }
        };
    } else if (masterConfig.env === 'xhr' || (!masterConfig.env &&
            text.createXhr())) {
        text.get = function (url, callback, errback, headers) {
            var xhr = text.createXhr(), header;
            xhr.open('GET', url, true);

            //Allow plugins direct access to xhr headers
            if (headers) {
                for (header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header.toLowerCase(), headers[header]);
                    }
                }
            }

            //Allow overrides specified in config
            if (masterConfig.onXhr) {
                masterConfig.onXhr(xhr, url);
            }

            xhr.onreadystatechange = function (evt) {
                var status, err;
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    status = xhr.status || 0;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        if (errback) {
                            errback(err);
                        }
                    } else {
                        callback(xhr.responseText);
                    }

                    if (masterConfig.onXhrComplete) {
                        masterConfig.onXhrComplete(xhr, url);
                    }
                }
            };
            xhr.send(null);
        };
    } else if (masterConfig.env === 'rhino' || (!masterConfig.env &&
            typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
        //Why Java, why is this so awkward?
        text.get = function (url, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(url),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                if (line !== null) {
                    stringBuffer.append(line);
                }

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    } else if (masterConfig.env === 'xpconnect' || (!masterConfig.env &&
            typeof components !== 'undefined' && components.classes &&
            components.interfaces)) {
        //Avert your gaze!
        Cc = components.classes;
        Ci = components.interfaces;
        components.utils['import']('resource://gre/modules/FileUtils.jsm');
        xpcIsWindows = ('@mozilla.org/windows-registry-key;1' in Cc);

        text.get = function (url, callback) {
            var inStream, convertStream, fileObj,
                readData = {};

            if (xpcIsWindows) {
                url = url.replace(/\//g, '\\');
            }

            fileObj = new FileUtils.File(url);

            //XPCOM, you so crazy
            try {
                inStream = Cc['@mozilla.org/network/file-input-stream;1']
                           .createInstance(Ci.nsIFileInputStream);
                inStream.init(fileObj, 1, 0, false);

                convertStream = Cc['@mozilla.org/intl/converter-input-stream;1']
                                .createInstance(Ci.nsIConverterInputStream);
                convertStream.init(inStream, "utf-8", inStream.available(),
                Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

                convertStream.readString(inStream.available(), readData);
                convertStream.close();
                inStream.close();
                callback(readData.value);
            } catch (e) {
                throw new Error((fileObj && fileObj.path || '') + ': ' + e);
            }
        };
    }
    return text;
});

/*!
 * Knockout JavaScript library v3.4.2
 * (c) The Knockout.js team - http://knockoutjs.com/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

(function() {(function(n){var x=this||(0,eval)("this"),t=x.document,M=x.navigator,u=x.jQuery,H=x.JSON;(function(n){"function"===typeof define&&define.amd?define('ko',["exports","require"],n):"object"===typeof exports&&"object"===typeof module?n(module.exports||exports):n(x.ko={})})(function(N,O){function J(a,c){return null===a||typeof a in R?a===c:!1}function S(b,c){var d;return function(){d||(d=a.a.setTimeout(function(){d=n;b()},c))}}function T(b,c){var d;return function(){clearTimeout(d);d=a.a.setTimeout(b,c)}}function U(a,
c){c&&c!==E?"beforeChange"===c?this.Ob(a):this.Ja(a,c):this.Pb(a)}function V(a,c){null!==c&&c.k&&c.k()}function W(a,c){var d=this.Mc,e=d[s];e.T||(this.ob&&this.Oa[c]?(d.Sb(c,a,this.Oa[c]),this.Oa[c]=null,--this.ob):e.s[c]||d.Sb(c,a,e.t?{$:a}:d.yc(a)),a.Ha&&a.Hc())}function K(b,c,d,e){a.d[b]={init:function(b,g,h,l,m){var k,r;a.m(function(){var q=g(),p=a.a.c(q),p=!d!==!p,A=!r;if(A||c||p!==k)A&&a.xa.Ca()&&(r=a.a.wa(a.f.childNodes(b),!0)),p?(A||a.f.fa(b,a.a.wa(r)),a.hb(e?e(m,q):m,b)):a.f.za(b),k=p},null,
{i:b});return{controlsDescendantBindings:!0}}};a.h.va[b]=!1;a.f.aa[b]=!0}var a="undefined"!==typeof N?N:{};a.b=function(b,c){for(var d=b.split("."),e=a,f=0;f<d.length-1;f++)e=e[d[f]];e[d[d.length-1]]=c};a.H=function(a,c,d){a[c]=d};a.version="3.4.2";a.b("version",a.version);a.options={deferUpdates:!1,useOnlyNativeEvents:!1};a.a=function(){function b(a,b){for(var c in a)a.hasOwnProperty(c)&&b(c,a[c])}function c(a,b){if(b)for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c]);return a}function d(a,b){a.__proto__=
b;return a}function e(b,c,d,e){var m=b[c].match(r)||[];a.a.r(d.match(r),function(b){a.a.ra(m,b,e)});b[c]=m.join(" ")}var f={__proto__:[]}instanceof Array,g="function"===typeof Symbol,h={},l={};h[M&&/Firefox\/2/i.test(M.userAgent)?"KeyboardEvent":"UIEvents"]=["keyup","keydown","keypress"];h.MouseEvents="click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave".split(" ");b(h,function(a,b){if(b.length)for(var c=0,d=b.length;c<d;c++)l[b[c]]=a});var m={propertychange:!0},k=
t&&function(){for(var a=3,b=t.createElement("div"),c=b.getElementsByTagName("i");b.innerHTML="\x3c!--[if gt IE "+ ++a+"]><i></i><![endif]--\x3e",c[0];);return 4<a?a:n}(),r=/\S+/g;return{gc:["authenticity_token",/^__RequestVerificationToken(_.*)?$/],r:function(a,b){for(var c=0,d=a.length;c<d;c++)b(a[c],c)},o:function(a,b){if("function"==typeof Array.prototype.indexOf)return Array.prototype.indexOf.call(a,b);for(var c=0,d=a.length;c<d;c++)if(a[c]===b)return c;return-1},Vb:function(a,b,c){for(var d=
0,e=a.length;d<e;d++)if(b.call(c,a[d],d))return a[d];return null},Na:function(b,c){var d=a.a.o(b,c);0<d?b.splice(d,1):0===d&&b.shift()},Wb:function(b){b=b||[];for(var c=[],d=0,e=b.length;d<e;d++)0>a.a.o(c,b[d])&&c.push(b[d]);return c},ib:function(a,b){a=a||[];for(var c=[],d=0,e=a.length;d<e;d++)c.push(b(a[d],d));return c},Ma:function(a,b){a=a||[];for(var c=[],d=0,e=a.length;d<e;d++)b(a[d],d)&&c.push(a[d]);return c},ta:function(a,b){if(b instanceof Array)a.push.apply(a,b);else for(var c=0,d=b.length;c<
d;c++)a.push(b[c]);return a},ra:function(b,c,d){var e=a.a.o(a.a.Bb(b),c);0>e?d&&b.push(c):d||b.splice(e,1)},la:f,extend:c,$a:d,ab:f?d:c,D:b,Ea:function(a,b){if(!a)return a;var c={},d;for(d in a)a.hasOwnProperty(d)&&(c[d]=b(a[d],d,a));return c},rb:function(b){for(;b.firstChild;)a.removeNode(b.firstChild)},nc:function(b){b=a.a.W(b);for(var c=(b[0]&&b[0].ownerDocument||t).createElement("div"),d=0,e=b.length;d<e;d++)c.appendChild(a.ba(b[d]));return c},wa:function(b,c){for(var d=0,e=b.length,m=[];d<e;d++){var k=
b[d].cloneNode(!0);m.push(c?a.ba(k):k)}return m},fa:function(b,c){a.a.rb(b);if(c)for(var d=0,e=c.length;d<e;d++)b.appendChild(c[d])},uc:function(b,c){var d=b.nodeType?[b]:b;if(0<d.length){for(var e=d[0],m=e.parentNode,k=0,f=c.length;k<f;k++)m.insertBefore(c[k],e);k=0;for(f=d.length;k<f;k++)a.removeNode(d[k])}},Ba:function(a,b){if(a.length){for(b=8===b.nodeType&&b.parentNode||b;a.length&&a[0].parentNode!==b;)a.splice(0,1);for(;1<a.length&&a[a.length-1].parentNode!==b;)a.length--;if(1<a.length){var c=
a[0],d=a[a.length-1];for(a.length=0;c!==d;)a.push(c),c=c.nextSibling;a.push(d)}}return a},wc:function(a,b){7>k?a.setAttribute("selected",b):a.selected=b},cb:function(a){return null===a||a===n?"":a.trim?a.trim():a.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")},sd:function(a,b){a=a||"";return b.length>a.length?!1:a.substring(0,b.length)===b},Rc:function(a,b){if(a===b)return!0;if(11===a.nodeType)return!1;if(b.contains)return b.contains(3===a.nodeType?a.parentNode:a);if(b.compareDocumentPosition)return 16==
(b.compareDocumentPosition(a)&16);for(;a&&a!=b;)a=a.parentNode;return!!a},qb:function(b){return a.a.Rc(b,b.ownerDocument.documentElement)},Tb:function(b){return!!a.a.Vb(b,a.a.qb)},A:function(a){return a&&a.tagName&&a.tagName.toLowerCase()},Zb:function(b){return a.onError?function(){try{return b.apply(this,arguments)}catch(c){throw a.onError&&a.onError(c),c;}}:b},setTimeout:function(b,c){return setTimeout(a.a.Zb(b),c)},dc:function(b){setTimeout(function(){a.onError&&a.onError(b);throw b;},0)},q:function(b,
c,d){var e=a.a.Zb(d);d=k&&m[c];if(a.options.useOnlyNativeEvents||d||!u)if(d||"function"!=typeof b.addEventListener)if("undefined"!=typeof b.attachEvent){var f=function(a){e.call(b,a)},l="on"+c;b.attachEvent(l,f);a.a.G.qa(b,function(){b.detachEvent(l,f)})}else throw Error("Browser doesn't support addEventListener or attachEvent");else b.addEventListener(c,e,!1);else u(b).bind(c,e)},Fa:function(b,c){if(!b||!b.nodeType)throw Error("element must be a DOM node when calling triggerEvent");var d;"input"===
a.a.A(b)&&b.type&&"click"==c.toLowerCase()?(d=b.type,d="checkbox"==d||"radio"==d):d=!1;if(a.options.useOnlyNativeEvents||!u||d)if("function"==typeof t.createEvent)if("function"==typeof b.dispatchEvent)d=t.createEvent(l[c]||"HTMLEvents"),d.initEvent(c,!0,!0,x,0,0,0,0,0,!1,!1,!1,!1,0,b),b.dispatchEvent(d);else throw Error("The supplied element doesn't support dispatchEvent");else if(d&&b.click)b.click();else if("undefined"!=typeof b.fireEvent)b.fireEvent("on"+c);else throw Error("Browser doesn't support triggering events");
else u(b).trigger(c)},c:function(b){return a.I(b)?b():b},Bb:function(b){return a.I(b)?b.p():b},fb:function(b,c,d){var k;c&&("object"===typeof b.classList?(k=b.classList[d?"add":"remove"],a.a.r(c.match(r),function(a){k.call(b.classList,a)})):"string"===typeof b.className.baseVal?e(b.className,"baseVal",c,d):e(b,"className",c,d))},bb:function(b,c){var d=a.a.c(c);if(null===d||d===n)d="";var e=a.f.firstChild(b);!e||3!=e.nodeType||a.f.nextSibling(e)?a.f.fa(b,[b.ownerDocument.createTextNode(d)]):e.data=
d;a.a.Wc(b)},vc:function(a,b){a.name=b;if(7>=k)try{a.mergeAttributes(t.createElement("<input name='"+a.name+"'/>"),!1)}catch(c){}},Wc:function(a){9<=k&&(a=1==a.nodeType?a:a.parentNode,a.style&&(a.style.zoom=a.style.zoom))},Sc:function(a){if(k){var b=a.style.width;a.style.width=0;a.style.width=b}},nd:function(b,c){b=a.a.c(b);c=a.a.c(c);for(var d=[],e=b;e<=c;e++)d.push(e);return d},W:function(a){for(var b=[],c=0,d=a.length;c<d;c++)b.push(a[c]);return b},bc:function(a){return g?Symbol(a):a},xd:6===k,
yd:7===k,C:k,ic:function(b,c){for(var d=a.a.W(b.getElementsByTagName("input")).concat(a.a.W(b.getElementsByTagName("textarea"))),e="string"==typeof c?function(a){return a.name===c}:function(a){return c.test(a.name)},k=[],m=d.length-1;0<=m;m--)e(d[m])&&k.push(d[m]);return k},kd:function(b){return"string"==typeof b&&(b=a.a.cb(b))?H&&H.parse?H.parse(b):(new Function("return "+b))():null},Gb:function(b,c,d){if(!H||!H.stringify)throw Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
return H.stringify(a.a.c(b),c,d)},ld:function(c,d,e){e=e||{};var k=e.params||{},m=e.includeFields||this.gc,f=c;if("object"==typeof c&&"form"===a.a.A(c))for(var f=c.action,l=m.length-1;0<=l;l--)for(var g=a.a.ic(c,m[l]),h=g.length-1;0<=h;h--)k[g[h].name]=g[h].value;d=a.a.c(d);var r=t.createElement("form");r.style.display="none";r.action=f;r.method="post";for(var n in d)c=t.createElement("input"),c.type="hidden",c.name=n,c.value=a.a.Gb(a.a.c(d[n])),r.appendChild(c);b(k,function(a,b){var c=t.createElement("input");
c.type="hidden";c.name=a;c.value=b;r.appendChild(c)});t.body.appendChild(r);e.submitter?e.submitter(r):r.submit();setTimeout(function(){r.parentNode.removeChild(r)},0)}}}();a.b("utils",a.a);a.b("utils.arrayForEach",a.a.r);a.b("utils.arrayFirst",a.a.Vb);a.b("utils.arrayFilter",a.a.Ma);a.b("utils.arrayGetDistinctValues",a.a.Wb);a.b("utils.arrayIndexOf",a.a.o);a.b("utils.arrayMap",a.a.ib);a.b("utils.arrayPushAll",a.a.ta);a.b("utils.arrayRemoveItem",a.a.Na);a.b("utils.extend",a.a.extend);a.b("utils.fieldsIncludedWithJsonPost",
a.a.gc);a.b("utils.getFormFields",a.a.ic);a.b("utils.peekObservable",a.a.Bb);a.b("utils.postJson",a.a.ld);a.b("utils.parseJson",a.a.kd);a.b("utils.registerEventHandler",a.a.q);a.b("utils.stringifyJson",a.a.Gb);a.b("utils.range",a.a.nd);a.b("utils.toggleDomNodeCssClass",a.a.fb);a.b("utils.triggerEvent",a.a.Fa);a.b("utils.unwrapObservable",a.a.c);a.b("utils.objectForEach",a.a.D);a.b("utils.addOrRemoveItem",a.a.ra);a.b("utils.setTextContent",a.a.bb);a.b("unwrap",a.a.c);Function.prototype.bind||(Function.prototype.bind=
function(a){var c=this;if(1===arguments.length)return function(){return c.apply(a,arguments)};var d=Array.prototype.slice.call(arguments,1);return function(){var e=d.slice(0);e.push.apply(e,arguments);return c.apply(a,e)}});a.a.e=new function(){function a(b,g){var h=b[d];if(!h||"null"===h||!e[h]){if(!g)return n;h=b[d]="ko"+c++;e[h]={}}return e[h]}var c=0,d="__ko__"+(new Date).getTime(),e={};return{get:function(c,d){var e=a(c,!1);return e===n?n:e[d]},set:function(c,d,e){if(e!==n||a(c,!1)!==n)a(c,!0)[d]=
e},clear:function(a){var b=a[d];return b?(delete e[b],a[d]=null,!0):!1},J:function(){return c++ +d}}};a.b("utils.domData",a.a.e);a.b("utils.domData.clear",a.a.e.clear);a.a.G=new function(){function b(b,c){var e=a.a.e.get(b,d);e===n&&c&&(e=[],a.a.e.set(b,d,e));return e}function c(d){var e=b(d,!1);if(e)for(var e=e.slice(0),l=0;l<e.length;l++)e[l](d);a.a.e.clear(d);a.a.G.cleanExternalData(d);if(f[d.nodeType])for(e=d.firstChild;d=e;)e=d.nextSibling,8===d.nodeType&&c(d)}var d=a.a.e.J(),e={1:!0,8:!0,9:!0},
f={1:!0,9:!0};return{qa:function(a,c){if("function"!=typeof c)throw Error("Callback must be a function");b(a,!0).push(c)},tc:function(c,e){var f=b(c,!1);f&&(a.a.Na(f,e),0==f.length&&a.a.e.set(c,d,n))},ba:function(b){if(e[b.nodeType]&&(c(b),f[b.nodeType])){var d=[];a.a.ta(d,b.getElementsByTagName("*"));for(var l=0,m=d.length;l<m;l++)c(d[l])}return b},removeNode:function(b){a.ba(b);b.parentNode&&b.parentNode.removeChild(b)},cleanExternalData:function(a){u&&"function"==typeof u.cleanData&&u.cleanData([a])}}};
a.ba=a.a.G.ba;a.removeNode=a.a.G.removeNode;a.b("cleanNode",a.ba);a.b("removeNode",a.removeNode);a.b("utils.domNodeDisposal",a.a.G);a.b("utils.domNodeDisposal.addDisposeCallback",a.a.G.qa);a.b("utils.domNodeDisposal.removeDisposeCallback",a.a.G.tc);(function(){var b=[0,"",""],c=[1,"<table>","</table>"],d=[3,"<table><tbody><tr>","</tr></tbody></table>"],e=[1,"<select multiple='multiple'>","</select>"],f={thead:c,tbody:c,tfoot:c,tr:[2,"<table><tbody>","</tbody></table>"],td:d,th:d,option:e,optgroup:e},
g=8>=a.a.C;a.a.na=function(c,d){var e;if(u)if(u.parseHTML)e=u.parseHTML(c,d)||[];else{if((e=u.clean([c],d))&&e[0]){for(var k=e[0];k.parentNode&&11!==k.parentNode.nodeType;)k=k.parentNode;k.parentNode&&k.parentNode.removeChild(k)}}else{(e=d)||(e=t);var k=e.parentWindow||e.defaultView||x,r=a.a.cb(c).toLowerCase(),q=e.createElement("div"),p;p=(r=r.match(/^<([a-z]+)[ >]/))&&f[r[1]]||b;r=p[0];p="ignored<div>"+p[1]+c+p[2]+"</div>";"function"==typeof k.innerShiv?q.appendChild(k.innerShiv(p)):(g&&e.appendChild(q),
q.innerHTML=p,g&&q.parentNode.removeChild(q));for(;r--;)q=q.lastChild;e=a.a.W(q.lastChild.childNodes)}return e};a.a.Eb=function(b,c){a.a.rb(b);c=a.a.c(c);if(null!==c&&c!==n)if("string"!=typeof c&&(c=c.toString()),u)u(b).html(c);else for(var d=a.a.na(c,b.ownerDocument),e=0;e<d.length;e++)b.appendChild(d[e])}})();a.b("utils.parseHtmlFragment",a.a.na);a.b("utils.setHtml",a.a.Eb);a.N=function(){function b(c,e){if(c)if(8==c.nodeType){var f=a.N.pc(c.nodeValue);null!=f&&e.push({Qc:c,hd:f})}else if(1==c.nodeType)for(var f=
0,g=c.childNodes,h=g.length;f<h;f++)b(g[f],e)}var c={};return{yb:function(a){if("function"!=typeof a)throw Error("You can only pass a function to ko.memoization.memoize()");var b=(4294967296*(1+Math.random())|0).toString(16).substring(1)+(4294967296*(1+Math.random())|0).toString(16).substring(1);c[b]=a;return"\x3c!--[ko_memo:"+b+"]--\x3e"},Bc:function(a,b){var f=c[a];if(f===n)throw Error("Couldn't find any memo with ID "+a+". Perhaps it's already been unmemoized.");try{return f.apply(null,b||[]),
!0}finally{delete c[a]}},Cc:function(c,e){var f=[];b(c,f);for(var g=0,h=f.length;g<h;g++){var l=f[g].Qc,m=[l];e&&a.a.ta(m,e);a.N.Bc(f[g].hd,m);l.nodeValue="";l.parentNode&&l.parentNode.removeChild(l)}},pc:function(a){return(a=a.match(/^\[ko_memo\:(.*?)\]$/))?a[1]:null}}}();a.b("memoization",a.N);a.b("memoization.memoize",a.N.yb);a.b("memoization.unmemoize",a.N.Bc);a.b("memoization.parseMemoText",a.N.pc);a.b("memoization.unmemoizeDomNodeAndDescendants",a.N.Cc);a.Z=function(){function b(){if(e)for(var b=
e,c=0,m;g<e;)if(m=d[g++]){if(g>b){if(5E3<=++c){g=e;a.a.dc(Error("'Too much recursion' after processing "+c+" task groups."));break}b=e}try{m()}catch(k){a.a.dc(k)}}}function c(){b();g=e=d.length=0}var d=[],e=0,f=1,g=0;return{scheduler:x.MutationObserver?function(a){var b=t.createElement("div");(new MutationObserver(a)).observe(b,{attributes:!0});return function(){b.classList.toggle("foo")}}(c):t&&"onreadystatechange"in t.createElement("script")?function(a){var b=t.createElement("script");b.onreadystatechange=
function(){b.onreadystatechange=null;t.documentElement.removeChild(b);b=null;a()};t.documentElement.appendChild(b)}:function(a){setTimeout(a,0)},Za:function(b){e||a.Z.scheduler(c);d[e++]=b;return f++},cancel:function(a){a-=f-e;a>=g&&a<e&&(d[a]=null)},resetForTesting:function(){var a=e-g;g=e=d.length=0;return a},rd:b}}();a.b("tasks",a.Z);a.b("tasks.schedule",a.Z.Za);a.b("tasks.runEarly",a.Z.rd);a.Aa={throttle:function(b,c){b.throttleEvaluation=c;var d=null;return a.B({read:b,write:function(e){clearTimeout(d);
d=a.a.setTimeout(function(){b(e)},c)}})},rateLimit:function(a,c){var d,e,f;"number"==typeof c?d=c:(d=c.timeout,e=c.method);a.gb=!1;f="notifyWhenChangesStop"==e?T:S;a.Wa(function(a){return f(a,d)})},deferred:function(b,c){if(!0!==c)throw Error("The 'deferred' extender only accepts the value 'true', because it is not supported to turn deferral off once enabled.");b.gb||(b.gb=!0,b.Wa(function(c){var e,f=!1;return function(){if(!f){a.Z.cancel(e);e=a.Z.Za(c);try{f=!0,b.notifySubscribers(n,"dirty")}finally{f=
!1}}}}))},notify:function(a,c){a.equalityComparer="always"==c?null:J}};var R={undefined:1,"boolean":1,number:1,string:1};a.b("extenders",a.Aa);a.zc=function(b,c,d){this.$=b;this.jb=c;this.Pc=d;this.T=!1;a.H(this,"dispose",this.k)};a.zc.prototype.k=function(){this.T=!0;this.Pc()};a.K=function(){a.a.ab(this,D);D.ub(this)};var E="change",D={ub:function(a){a.F={change:[]};a.Qb=1},Y:function(b,c,d){var e=this;d=d||E;var f=new a.zc(e,c?b.bind(c):b,function(){a.a.Na(e.F[d],f);e.Ka&&e.Ka(d)});e.ua&&e.ua(d);
e.F[d]||(e.F[d]=[]);e.F[d].push(f);return f},notifySubscribers:function(b,c){c=c||E;c===E&&this.Kb();if(this.Ra(c)){var d=c===E&&this.Fc||this.F[c].slice(0);try{a.l.Xb();for(var e=0,f;f=d[e];++e)f.T||f.jb(b)}finally{a.l.end()}}},Pa:function(){return this.Qb},Zc:function(a){return this.Pa()!==a},Kb:function(){++this.Qb},Wa:function(b){var c=this,d=a.I(c),e,f,g,h;c.Ja||(c.Ja=c.notifySubscribers,c.notifySubscribers=U);var l=b(function(){c.Ha=!1;d&&h===c&&(h=c.Mb?c.Mb():c());var a=f||c.Ua(g,h);f=e=!1;
a&&c.Ja(g=h)});c.Pb=function(a){c.Fc=c.F[E].slice(0);c.Ha=e=!0;h=a;l()};c.Ob=function(a){e||(g=a,c.Ja(a,"beforeChange"))};c.Hc=function(){c.Ua(g,c.p(!0))&&(f=!0)}},Ra:function(a){return this.F[a]&&this.F[a].length},Xc:function(b){if(b)return this.F[b]&&this.F[b].length||0;var c=0;a.a.D(this.F,function(a,b){"dirty"!==a&&(c+=b.length)});return c},Ua:function(a,c){return!this.equalityComparer||!this.equalityComparer(a,c)},extend:function(b){var c=this;b&&a.a.D(b,function(b,e){var f=a.Aa[b];"function"==
typeof f&&(c=f(c,e)||c)});return c}};a.H(D,"subscribe",D.Y);a.H(D,"extend",D.extend);a.H(D,"getSubscriptionsCount",D.Xc);a.a.la&&a.a.$a(D,Function.prototype);a.K.fn=D;a.lc=function(a){return null!=a&&"function"==typeof a.Y&&"function"==typeof a.notifySubscribers};a.b("subscribable",a.K);a.b("isSubscribable",a.lc);a.xa=a.l=function(){function b(a){d.push(e);e=a}function c(){e=d.pop()}var d=[],e,f=0;return{Xb:b,end:c,sc:function(b){if(e){if(!a.lc(b))throw Error("Only subscribable things can act as dependencies");
e.jb.call(e.Lc,b,b.Gc||(b.Gc=++f))}},w:function(a,d,e){try{return b(),a.apply(d,e||[])}finally{c()}},Ca:function(){if(e)return e.m.Ca()},Va:function(){if(e)return e.Va}}}();a.b("computedContext",a.xa);a.b("computedContext.getDependenciesCount",a.xa.Ca);a.b("computedContext.isInitial",a.xa.Va);a.b("ignoreDependencies",a.wd=a.l.w);var F=a.a.bc("_latestValue");a.O=function(b){function c(){if(0<arguments.length)return c.Ua(c[F],arguments[0])&&(c.ia(),c[F]=arguments[0],c.ha()),this;a.l.sc(c);return c[F]}
c[F]=b;a.a.la||a.a.extend(c,a.K.fn);a.K.fn.ub(c);a.a.ab(c,B);a.options.deferUpdates&&a.Aa.deferred(c,!0);return c};var B={equalityComparer:J,p:function(){return this[F]},ha:function(){this.notifySubscribers(this[F])},ia:function(){this.notifySubscribers(this[F],"beforeChange")}};a.a.la&&a.a.$a(B,a.K.fn);var I=a.O.md="__ko_proto__";B[I]=a.O;a.Qa=function(b,c){return null===b||b===n||b[I]===n?!1:b[I]===c?!0:a.Qa(b[I],c)};a.I=function(b){return a.Qa(b,a.O)};a.Da=function(b){return"function"==typeof b&&
b[I]===a.O||"function"==typeof b&&b[I]===a.B&&b.$c?!0:!1};a.b("observable",a.O);a.b("isObservable",a.I);a.b("isWriteableObservable",a.Da);a.b("isWritableObservable",a.Da);a.b("observable.fn",B);a.H(B,"peek",B.p);a.H(B,"valueHasMutated",B.ha);a.H(B,"valueWillMutate",B.ia);a.ma=function(b){b=b||[];if("object"!=typeof b||!("length"in b))throw Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");b=a.O(b);a.a.ab(b,a.ma.fn);return b.extend({trackArrayChanges:!0})};
a.ma.fn={remove:function(b){for(var c=this.p(),d=[],e="function"!=typeof b||a.I(b)?function(a){return a===b}:b,f=0;f<c.length;f++){var g=c[f];e(g)&&(0===d.length&&this.ia(),d.push(g),c.splice(f,1),f--)}d.length&&this.ha();return d},removeAll:function(b){if(b===n){var c=this.p(),d=c.slice(0);this.ia();c.splice(0,c.length);this.ha();return d}return b?this.remove(function(c){return 0<=a.a.o(b,c)}):[]},destroy:function(b){var c=this.p(),d="function"!=typeof b||a.I(b)?function(a){return a===b}:b;this.ia();
for(var e=c.length-1;0<=e;e--)d(c[e])&&(c[e]._destroy=!0);this.ha()},destroyAll:function(b){return b===n?this.destroy(function(){return!0}):b?this.destroy(function(c){return 0<=a.a.o(b,c)}):[]},indexOf:function(b){var c=this();return a.a.o(c,b)},replace:function(a,c){var d=this.indexOf(a);0<=d&&(this.ia(),this.p()[d]=c,this.ha())}};a.a.la&&a.a.$a(a.ma.fn,a.O.fn);a.a.r("pop push reverse shift sort splice unshift".split(" "),function(b){a.ma.fn[b]=function(){var a=this.p();this.ia();this.Yb(a,b,arguments);
var d=a[b].apply(a,arguments);this.ha();return d===a?this:d}});a.a.r(["slice"],function(b){a.ma.fn[b]=function(){var a=this();return a[b].apply(a,arguments)}});a.b("observableArray",a.ma);a.Aa.trackArrayChanges=function(b,c){function d(){if(!e){e=!0;l=b.notifySubscribers;b.notifySubscribers=function(a,b){b&&b!==E||++h;return l.apply(this,arguments)};var c=[].concat(b.p()||[]);f=null;g=b.Y(function(d){d=[].concat(d||[]);if(b.Ra("arrayChange")){var e;if(!f||1<h)f=a.a.lb(c,d,b.kb);e=f}c=d;f=null;h=0;
e&&e.length&&b.notifySubscribers(e,"arrayChange")})}}b.kb={};c&&"object"==typeof c&&a.a.extend(b.kb,c);b.kb.sparse=!0;if(!b.Yb){var e=!1,f=null,g,h=0,l,m=b.ua,k=b.Ka;b.ua=function(a){m&&m.call(b,a);"arrayChange"===a&&d()};b.Ka=function(a){k&&k.call(b,a);"arrayChange"!==a||b.Ra("arrayChange")||(l&&(b.notifySubscribers=l,l=n),g.k(),e=!1)};b.Yb=function(b,c,d){function k(a,b,c){return m[m.length]={status:a,value:b,index:c}}if(e&&!h){var m=[],l=b.length,g=d.length,G=0;switch(c){case "push":G=l;case "unshift":for(c=
0;c<g;c++)k("added",d[c],G+c);break;case "pop":G=l-1;case "shift":l&&k("deleted",b[G],G);break;case "splice":c=Math.min(Math.max(0,0>d[0]?l+d[0]:d[0]),l);for(var l=1===g?l:Math.min(c+(d[1]||0),l),g=c+g-2,G=Math.max(l,g),n=[],s=[],w=2;c<G;++c,++w)c<l&&s.push(k("deleted",b[c],c)),c<g&&n.push(k("added",d[w],c));a.a.hc(s,n);break;default:return}f=m}}}};var s=a.a.bc("_state");a.m=a.B=function(b,c,d){function e(){if(0<arguments.length){if("function"===typeof f)f.apply(g.sb,arguments);else throw Error("Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
return this}a.l.sc(e);(g.V||g.t&&e.Sa())&&e.U();return g.M}"object"===typeof b?d=b:(d=d||{},b&&(d.read=b));if("function"!=typeof d.read)throw Error("Pass a function that returns the value of the ko.computed");var f=d.write,g={M:n,da:!0,V:!0,Ta:!1,Hb:!1,T:!1,Ya:!1,t:!1,od:d.read,sb:c||d.owner,i:d.disposeWhenNodeIsRemoved||d.i||null,ya:d.disposeWhen||d.ya,pb:null,s:{},L:0,fc:null};e[s]=g;e.$c="function"===typeof f;a.a.la||a.a.extend(e,a.K.fn);a.K.fn.ub(e);a.a.ab(e,z);d.pure?(g.Ya=!0,g.t=!0,a.a.extend(e,
Y)):d.deferEvaluation&&a.a.extend(e,Z);a.options.deferUpdates&&a.Aa.deferred(e,!0);g.i&&(g.Hb=!0,g.i.nodeType||(g.i=null));g.t||d.deferEvaluation||e.U();g.i&&e.ca()&&a.a.G.qa(g.i,g.pb=function(){e.k()});return e};var z={equalityComparer:J,Ca:function(){return this[s].L},Sb:function(a,c,d){if(this[s].Ya&&c===this)throw Error("A 'pure' computed must not be called recursively");this[s].s[a]=d;d.Ia=this[s].L++;d.pa=c.Pa()},Sa:function(){var a,c,d=this[s].s;for(a in d)if(d.hasOwnProperty(a)&&(c=d[a],this.oa&&
c.$.Ha||c.$.Zc(c.pa)))return!0},gd:function(){this.oa&&!this[s].Ta&&this.oa(!1)},ca:function(){var a=this[s];return a.V||0<a.L},qd:function(){this.Ha?this[s].V&&(this[s].da=!0):this.ec()},yc:function(a){if(a.gb&&!this[s].i){var c=a.Y(this.gd,this,"dirty"),d=a.Y(this.qd,this);return{$:a,k:function(){c.k();d.k()}}}return a.Y(this.ec,this)},ec:function(){var b=this,c=b.throttleEvaluation;c&&0<=c?(clearTimeout(this[s].fc),this[s].fc=a.a.setTimeout(function(){b.U(!0)},c)):b.oa?b.oa(!0):b.U(!0)},U:function(b){var c=
this[s],d=c.ya,e=!1;if(!c.Ta&&!c.T){if(c.i&&!a.a.qb(c.i)||d&&d()){if(!c.Hb){this.k();return}}else c.Hb=!1;c.Ta=!0;try{e=this.Vc(b)}finally{c.Ta=!1}c.L||this.k();return e}},Vc:function(b){var c=this[s],d=!1,e=c.Ya?n:!c.L,f={Mc:this,Oa:c.s,ob:c.L};a.l.Xb({Lc:f,jb:W,m:this,Va:e});c.s={};c.L=0;f=this.Uc(c,f);this.Ua(c.M,f)&&(c.t||this.notifySubscribers(c.M,"beforeChange"),c.M=f,c.t?this.Kb():b&&this.notifySubscribers(c.M),d=!0);e&&this.notifySubscribers(c.M,"awake");return d},Uc:function(b,c){try{var d=
b.od;return b.sb?d.call(b.sb):d()}finally{a.l.end(),c.ob&&!b.t&&a.a.D(c.Oa,V),b.da=b.V=!1}},p:function(a){var c=this[s];(c.V&&(a||!c.L)||c.t&&this.Sa())&&this.U();return c.M},Wa:function(b){a.K.fn.Wa.call(this,b);this.Mb=function(){this[s].da?this.U():this[s].V=!1;return this[s].M};this.oa=function(a){this.Ob(this[s].M);this[s].V=!0;a&&(this[s].da=!0);this.Pb(this)}},k:function(){var b=this[s];!b.t&&b.s&&a.a.D(b.s,function(a,b){b.k&&b.k()});b.i&&b.pb&&a.a.G.tc(b.i,b.pb);b.s=null;b.L=0;b.T=!0;b.da=
!1;b.V=!1;b.t=!1;b.i=null}},Y={ua:function(b){var c=this,d=c[s];if(!d.T&&d.t&&"change"==b){d.t=!1;if(d.da||c.Sa())d.s=null,d.L=0,c.U()&&c.Kb();else{var e=[];a.a.D(d.s,function(a,b){e[b.Ia]=a});a.a.r(e,function(a,b){var e=d.s[a],l=c.yc(e.$);l.Ia=b;l.pa=e.pa;d.s[a]=l})}d.T||c.notifySubscribers(d.M,"awake")}},Ka:function(b){var c=this[s];c.T||"change"!=b||this.Ra("change")||(a.a.D(c.s,function(a,b){b.k&&(c.s[a]={$:b.$,Ia:b.Ia,pa:b.pa},b.k())}),c.t=!0,this.notifySubscribers(n,"asleep"))},Pa:function(){var b=
this[s];b.t&&(b.da||this.Sa())&&this.U();return a.K.fn.Pa.call(this)}},Z={ua:function(a){"change"!=a&&"beforeChange"!=a||this.p()}};a.a.la&&a.a.$a(z,a.K.fn);var P=a.O.md;a.m[P]=a.O;z[P]=a.m;a.bd=function(b){return a.Qa(b,a.m)};a.cd=function(b){return a.Qa(b,a.m)&&b[s]&&b[s].Ya};a.b("computed",a.m);a.b("dependentObservable",a.m);a.b("isComputed",a.bd);a.b("isPureComputed",a.cd);a.b("computed.fn",z);a.H(z,"peek",z.p);a.H(z,"dispose",z.k);a.H(z,"isActive",z.ca);a.H(z,"getDependenciesCount",z.Ca);a.rc=
function(b,c){if("function"===typeof b)return a.m(b,c,{pure:!0});b=a.a.extend({},b);b.pure=!0;return a.m(b,c)};a.b("pureComputed",a.rc);(function(){function b(a,f,g){g=g||new d;a=f(a);if("object"!=typeof a||null===a||a===n||a instanceof RegExp||a instanceof Date||a instanceof String||a instanceof Number||a instanceof Boolean)return a;var h=a instanceof Array?[]:{};g.save(a,h);c(a,function(c){var d=f(a[c]);switch(typeof d){case "boolean":case "number":case "string":case "function":h[c]=d;break;case "object":case "undefined":var k=
g.get(d);h[c]=k!==n?k:b(d,f,g)}});return h}function c(a,b){if(a instanceof Array){for(var c=0;c<a.length;c++)b(c);"function"==typeof a.toJSON&&b("toJSON")}else for(c in a)b(c)}function d(){this.keys=[];this.Lb=[]}a.Ac=function(c){if(0==arguments.length)throw Error("When calling ko.toJS, pass the object you want to convert.");return b(c,function(b){for(var c=0;a.I(b)&&10>c;c++)b=b();return b})};a.toJSON=function(b,c,d){b=a.Ac(b);return a.a.Gb(b,c,d)};d.prototype={save:function(b,c){var d=a.a.o(this.keys,
b);0<=d?this.Lb[d]=c:(this.keys.push(b),this.Lb.push(c))},get:function(b){b=a.a.o(this.keys,b);return 0<=b?this.Lb[b]:n}}})();a.b("toJS",a.Ac);a.b("toJSON",a.toJSON);(function(){a.j={u:function(b){switch(a.a.A(b)){case "option":return!0===b.__ko__hasDomDataOptionValue__?a.a.e.get(b,a.d.options.zb):7>=a.a.C?b.getAttributeNode("value")&&b.getAttributeNode("value").specified?b.value:b.text:b.value;case "select":return 0<=b.selectedIndex?a.j.u(b.options[b.selectedIndex]):n;default:return b.value}},ja:function(b,
c,d){switch(a.a.A(b)){case "option":switch(typeof c){case "string":a.a.e.set(b,a.d.options.zb,n);"__ko__hasDomDataOptionValue__"in b&&delete b.__ko__hasDomDataOptionValue__;b.value=c;break;default:a.a.e.set(b,a.d.options.zb,c),b.__ko__hasDomDataOptionValue__=!0,b.value="number"===typeof c?c:""}break;case "select":if(""===c||null===c)c=n;for(var e=-1,f=0,g=b.options.length,h;f<g;++f)if(h=a.j.u(b.options[f]),h==c||""==h&&c===n){e=f;break}if(d||0<=e||c===n&&1<b.size)b.selectedIndex=e;break;default:if(null===
c||c===n)c="";b.value=c}}}})();a.b("selectExtensions",a.j);a.b("selectExtensions.readValue",a.j.u);a.b("selectExtensions.writeValue",a.j.ja);a.h=function(){function b(b){b=a.a.cb(b);123===b.charCodeAt(0)&&(b=b.slice(1,-1));var c=[],d=b.match(e),r,h=[],p=0;if(d){d.push(",");for(var A=0,y;y=d[A];++A){var v=y.charCodeAt(0);if(44===v){if(0>=p){c.push(r&&h.length?{key:r,value:h.join("")}:{unknown:r||h.join("")});r=p=0;h=[];continue}}else if(58===v){if(!p&&!r&&1===h.length){r=h.pop();continue}}else 47===
v&&A&&1<y.length?(v=d[A-1].match(f))&&!g[v[0]]&&(b=b.substr(b.indexOf(y)+1),d=b.match(e),d.push(","),A=-1,y="/"):40===v||123===v||91===v?++p:41===v||125===v||93===v?--p:r||h.length||34!==v&&39!==v||(y=y.slice(1,-1));h.push(y)}}return c}var c=["true","false","null","undefined"],d=/^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i,e=RegExp("\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'|/(?:[^/\\\\]|\\\\.)*/w*|[^\\s:,/][^,\"'{}()/:[\\]]*[^\\s,\"'{}()/:[\\]]|[^\\s]","g"),f=/[\])"'A-Za-z0-9_$]+$/,
g={"in":1,"return":1,"typeof":1},h={};return{va:[],ga:h,Ab:b,Xa:function(e,m){function k(b,e){var m;if(!A){var l=a.getBindingHandler(b);if(l&&l.preprocess&&!(e=l.preprocess(e,b,k)))return;if(l=h[b])m=e,0<=a.a.o(c,m)?m=!1:(l=m.match(d),m=null===l?!1:l[1]?"Object("+l[1]+")"+l[2]:m),l=m;l&&g.push("'"+b+"':function(_z){"+m+"=_z}")}p&&(e="function(){return "+e+" }");f.push("'"+b+"':"+e)}m=m||{};var f=[],g=[],p=m.valueAccessors,A=m.bindingParams,y="string"===typeof e?b(e):e;a.a.r(y,function(a){k(a.key||
a.unknown,a.value)});g.length&&k("_ko_property_writers","{"+g.join(",")+" }");return f.join(",")},fd:function(a,b){for(var c=0;c<a.length;c++)if(a[c].key==b)return!0;return!1},Ga:function(b,c,d,e,f){if(b&&a.I(b))!a.Da(b)||f&&b.p()===e||b(e);else if((b=c.get("_ko_property_writers"))&&b[d])b[d](e)}}}();a.b("expressionRewriting",a.h);a.b("expressionRewriting.bindingRewriteValidators",a.h.va);a.b("expressionRewriting.parseObjectLiteral",a.h.Ab);a.b("expressionRewriting.preProcessBindings",a.h.Xa);a.b("expressionRewriting._twoWayBindings",
a.h.ga);a.b("jsonExpressionRewriting",a.h);a.b("jsonExpressionRewriting.insertPropertyAccessorsIntoJson",a.h.Xa);(function(){function b(a){return 8==a.nodeType&&g.test(f?a.text:a.nodeValue)}function c(a){return 8==a.nodeType&&h.test(f?a.text:a.nodeValue)}function d(a,d){for(var e=a,f=1,l=[];e=e.nextSibling;){if(c(e)&&(f--,0===f))return l;l.push(e);b(e)&&f++}if(!d)throw Error("Cannot find closing comment tag to match: "+a.nodeValue);return null}function e(a,b){var c=d(a,b);return c?0<c.length?c[c.length-
1].nextSibling:a.nextSibling:null}var f=t&&"\x3c!--test--\x3e"===t.createComment("test").text,g=f?/^\x3c!--\s*ko(?:\s+([\s\S]+))?\s*--\x3e$/:/^\s*ko(?:\s+([\s\S]+))?\s*$/,h=f?/^\x3c!--\s*\/ko\s*--\x3e$/:/^\s*\/ko\s*$/,l={ul:!0,ol:!0};a.f={aa:{},childNodes:function(a){return b(a)?d(a):a.childNodes},za:function(c){if(b(c)){c=a.f.childNodes(c);for(var d=0,e=c.length;d<e;d++)a.removeNode(c[d])}else a.a.rb(c)},fa:function(c,d){if(b(c)){a.f.za(c);for(var e=c.nextSibling,f=0,l=d.length;f<l;f++)e.parentNode.insertBefore(d[f],
e)}else a.a.fa(c,d)},qc:function(a,c){b(a)?a.parentNode.insertBefore(c,a.nextSibling):a.firstChild?a.insertBefore(c,a.firstChild):a.appendChild(c)},kc:function(c,d,e){e?b(c)?c.parentNode.insertBefore(d,e.nextSibling):e.nextSibling?c.insertBefore(d,e.nextSibling):c.appendChild(d):a.f.qc(c,d)},firstChild:function(a){return b(a)?!a.nextSibling||c(a.nextSibling)?null:a.nextSibling:a.firstChild},nextSibling:function(a){b(a)&&(a=e(a));return a.nextSibling&&c(a.nextSibling)?null:a.nextSibling},Yc:b,vd:function(a){return(a=
(f?a.text:a.nodeValue).match(g))?a[1]:null},oc:function(d){if(l[a.a.A(d)]){var k=d.firstChild;if(k){do if(1===k.nodeType){var f;f=k.firstChild;var g=null;if(f){do if(g)g.push(f);else if(b(f)){var h=e(f,!0);h?f=h:g=[f]}else c(f)&&(g=[f]);while(f=f.nextSibling)}if(f=g)for(g=k.nextSibling,h=0;h<f.length;h++)g?d.insertBefore(f[h],g):d.appendChild(f[h])}while(k=k.nextSibling)}}}}})();a.b("virtualElements",a.f);a.b("virtualElements.allowedBindings",a.f.aa);a.b("virtualElements.emptyNode",a.f.za);a.b("virtualElements.insertAfter",
a.f.kc);a.b("virtualElements.prepend",a.f.qc);a.b("virtualElements.setDomNodeChildren",a.f.fa);(function(){a.S=function(){this.Kc={}};a.a.extend(a.S.prototype,{nodeHasBindings:function(b){switch(b.nodeType){case 1:return null!=b.getAttribute("data-bind")||a.g.getComponentNameForNode(b);case 8:return a.f.Yc(b);default:return!1}},getBindings:function(b,c){var d=this.getBindingsString(b,c),d=d?this.parseBindingsString(d,c,b):null;return a.g.Rb(d,b,c,!1)},getBindingAccessors:function(b,c){var d=this.getBindingsString(b,
c),d=d?this.parseBindingsString(d,c,b,{valueAccessors:!0}):null;return a.g.Rb(d,b,c,!0)},getBindingsString:function(b){switch(b.nodeType){case 1:return b.getAttribute("data-bind");case 8:return a.f.vd(b);default:return null}},parseBindingsString:function(b,c,d,e){try{var f=this.Kc,g=b+(e&&e.valueAccessors||""),h;if(!(h=f[g])){var l,m="with($context){with($data||{}){return{"+a.h.Xa(b,e)+"}}}";l=new Function("$context","$element",m);h=f[g]=l}return h(c,d)}catch(k){throw k.message="Unable to parse bindings.\nBindings value: "+
b+"\nMessage: "+k.message,k;}}});a.S.instance=new a.S})();a.b("bindingProvider",a.S);(function(){function b(a){return function(){return a}}function c(a){return a()}function d(b){return a.a.Ea(a.l.w(b),function(a,c){return function(){return b()[c]}})}function e(c,e,k){return"function"===typeof c?d(c.bind(null,e,k)):a.a.Ea(c,b)}function f(a,b){return d(this.getBindings.bind(this,a,b))}function g(b,c,d){var e,k=a.f.firstChild(c),f=a.S.instance,m=f.preprocessNode;if(m){for(;e=k;)k=a.f.nextSibling(e),
m.call(f,e);k=a.f.firstChild(c)}for(;e=k;)k=a.f.nextSibling(e),h(b,e,d)}function h(b,c,d){var e=!0,k=1===c.nodeType;k&&a.f.oc(c);if(k&&d||a.S.instance.nodeHasBindings(c))e=m(c,null,b,d).shouldBindDescendants;e&&!r[a.a.A(c)]&&g(b,c,!k)}function l(b){var c=[],d={},e=[];a.a.D(b,function X(k){if(!d[k]){var f=a.getBindingHandler(k);f&&(f.after&&(e.push(k),a.a.r(f.after,function(c){if(b[c]){if(-1!==a.a.o(e,c))throw Error("Cannot combine the following bindings, because they have a cyclic dependency: "+e.join(", "));
X(c)}}),e.length--),c.push({key:k,jc:f}));d[k]=!0}});return c}function m(b,d,e,k){var m=a.a.e.get(b,q);if(!d){if(m)throw Error("You cannot apply bindings multiple times to the same element.");a.a.e.set(b,q,!0)}!m&&k&&a.xc(b,e);var g;if(d&&"function"!==typeof d)g=d;else{var h=a.S.instance,r=h.getBindingAccessors||f,p=a.B(function(){(g=d?d(e,b):r.call(h,b,e))&&e.Q&&e.Q();return g},null,{i:b});g&&p.ca()||(p=null)}var s;if(g){var t=p?function(a){return function(){return c(p()[a])}}:function(a){return g[a]},
u=function(){return a.a.Ea(p?p():g,c)};u.get=function(a){return g[a]&&c(t(a))};u.has=function(a){return a in g};k=l(g);a.a.r(k,function(c){var d=c.jc.init,k=c.jc.update,f=c.key;if(8===b.nodeType&&!a.f.aa[f])throw Error("The binding '"+f+"' cannot be used with virtual elements");try{"function"==typeof d&&a.l.w(function(){var a=d(b,t(f),u,e.$data,e);if(a&&a.controlsDescendantBindings){if(s!==n)throw Error("Multiple bindings ("+s+" and "+f+") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");
s=f}}),"function"==typeof k&&a.B(function(){k(b,t(f),u,e.$data,e)},null,{i:b})}catch(m){throw m.message='Unable to process binding "'+f+": "+g[f]+'"\nMessage: '+m.message,m;}})}return{shouldBindDescendants:s===n}}function k(b){return b&&b instanceof a.R?b:new a.R(b)}a.d={};var r={script:!0,textarea:!0,template:!0};a.getBindingHandler=function(b){return a.d[b]};a.R=function(b,c,d,e,k){function f(){var k=g?b():b,m=a.a.c(k);c?(c.Q&&c.Q(),a.a.extend(l,c),l.Q=r):(l.$parents=[],l.$root=m,l.ko=a);l.$rawData=
k;l.$data=m;d&&(l[d]=m);e&&e(l,c,m);return l.$data}function m(){return h&&!a.a.Tb(h)}var l=this,g="function"==typeof b&&!a.I(b),h,r;k&&k.exportDependencies?f():(r=a.B(f,null,{ya:m,i:!0}),r.ca()&&(l.Q=r,r.equalityComparer=null,h=[],r.Dc=function(b){h.push(b);a.a.G.qa(b,function(b){a.a.Na(h,b);h.length||(r.k(),l.Q=r=n)})}))};a.R.prototype.createChildContext=function(b,c,d,e){return new a.R(b,this,c,function(a,b){a.$parentContext=b;a.$parent=b.$data;a.$parents=(b.$parents||[]).slice(0);a.$parents.unshift(a.$parent);
d&&d(a)},e)};a.R.prototype.extend=function(b){return new a.R(this.Q||this.$data,this,null,function(c,d){c.$rawData=d.$rawData;a.a.extend(c,"function"==typeof b?b():b)})};a.R.prototype.ac=function(a,b){return this.createChildContext(a,b,null,{exportDependencies:!0})};var q=a.a.e.J(),p=a.a.e.J();a.xc=function(b,c){if(2==arguments.length)a.a.e.set(b,p,c),c.Q&&c.Q.Dc(b);else return a.a.e.get(b,p)};a.La=function(b,c,d){1===b.nodeType&&a.f.oc(b);return m(b,c,k(d),!0)};a.Ic=function(b,c,d){d=k(d);return a.La(b,
e(c,d,b),d)};a.hb=function(a,b){1!==b.nodeType&&8!==b.nodeType||g(k(a),b,!0)};a.Ub=function(a,b){!u&&x.jQuery&&(u=x.jQuery);if(b&&1!==b.nodeType&&8!==b.nodeType)throw Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");b=b||x.document.body;h(k(a),b,!0)};a.nb=function(b){switch(b.nodeType){case 1:case 8:var c=a.xc(b);if(c)return c;if(b.parentNode)return a.nb(b.parentNode)}return n};a.Oc=function(b){return(b=a.nb(b))?b.$data:n};a.b("bindingHandlers",
a.d);a.b("applyBindings",a.Ub);a.b("applyBindingsToDescendants",a.hb);a.b("applyBindingAccessorsToNode",a.La);a.b("applyBindingsToNode",a.Ic);a.b("contextFor",a.nb);a.b("dataFor",a.Oc)})();(function(b){function c(c,e){var m=f.hasOwnProperty(c)?f[c]:b,k;m?m.Y(e):(m=f[c]=new a.K,m.Y(e),d(c,function(b,d){var e=!(!d||!d.synchronous);g[c]={definition:b,dd:e};delete f[c];k||e?m.notifySubscribers(b):a.Z.Za(function(){m.notifySubscribers(b)})}),k=!0)}function d(a,b){e("getConfig",[a],function(c){c?e("loadComponent",
[a,c],function(a){b(a,c)}):b(null,null)})}function e(c,d,f,k){k||(k=a.g.loaders.slice(0));var g=k.shift();if(g){var q=g[c];if(q){var p=!1;if(q.apply(g,d.concat(function(a){p?f(null):null!==a?f(a):e(c,d,f,k)}))!==b&&(p=!0,!g.suppressLoaderExceptions))throw Error("Component loaders must supply values by invoking the callback, not by returning values synchronously.");}else e(c,d,f,k)}else f(null)}var f={},g={};a.g={get:function(d,e){var f=g.hasOwnProperty(d)?g[d]:b;f?f.dd?a.l.w(function(){e(f.definition)}):
a.Z.Za(function(){e(f.definition)}):c(d,e)},$b:function(a){delete g[a]},Nb:e};a.g.loaders=[];a.b("components",a.g);a.b("components.get",a.g.get);a.b("components.clearCachedDefinition",a.g.$b)})();(function(){function b(b,c,d,e){function g(){0===--y&&e(h)}var h={},y=2,v=d.template;d=d.viewModel;v?f(c,v,function(c){a.g.Nb("loadTemplate",[b,c],function(a){h.template=a;g()})}):g();d?f(c,d,function(c){a.g.Nb("loadViewModel",[b,c],function(a){h[l]=a;g()})}):g()}function c(a,b,d){if("function"===typeof b)d(function(a){return new b(a)});
else if("function"===typeof b[l])d(b[l]);else if("instance"in b){var e=b.instance;d(function(){return e})}else"viewModel"in b?c(a,b.viewModel,d):a("Unknown viewModel value: "+b)}function d(b){switch(a.a.A(b)){case "script":return a.a.na(b.text);case "textarea":return a.a.na(b.value);case "template":if(e(b.content))return a.a.wa(b.content.childNodes)}return a.a.wa(b.childNodes)}function e(a){return x.DocumentFragment?a instanceof DocumentFragment:a&&11===a.nodeType}function f(a,b,c){"string"===typeof b.require?
O||x.require?(O||x.require)([b.require],c):a("Uses require, but no AMD loader is present"):c(b)}function g(a){return function(b){throw Error("Component '"+a+"': "+b);}}var h={};a.g.register=function(b,c){if(!c)throw Error("Invalid configuration for "+b);if(a.g.wb(b))throw Error("Component "+b+" is already registered");h[b]=c};a.g.wb=function(a){return h.hasOwnProperty(a)};a.g.ud=function(b){delete h[b];a.g.$b(b)};a.g.cc={getConfig:function(a,b){b(h.hasOwnProperty(a)?h[a]:null)},loadComponent:function(a,
c,d){var e=g(a);f(e,c,function(c){b(a,e,c,d)})},loadTemplate:function(b,c,f){b=g(b);if("string"===typeof c)f(a.a.na(c));else if(c instanceof Array)f(c);else if(e(c))f(a.a.W(c.childNodes));else if(c.element)if(c=c.element,x.HTMLElement?c instanceof HTMLElement:c&&c.tagName&&1===c.nodeType)f(d(c));else if("string"===typeof c){var l=t.getElementById(c);l?f(d(l)):b("Cannot find element with ID "+c)}else b("Unknown element type: "+c);else b("Unknown template value: "+c)},loadViewModel:function(a,b,d){c(g(a),
b,d)}};var l="createViewModel";a.b("components.register",a.g.register);a.b("components.isRegistered",a.g.wb);a.b("components.unregister",a.g.ud);a.b("components.defaultLoader",a.g.cc);a.g.loaders.push(a.g.cc);a.g.Ec=h})();(function(){function b(b,e){var f=b.getAttribute("params");if(f){var f=c.parseBindingsString(f,e,b,{valueAccessors:!0,bindingParams:!0}),f=a.a.Ea(f,function(c){return a.m(c,null,{i:b})}),g=a.a.Ea(f,function(c){var e=c.p();return c.ca()?a.m({read:function(){return a.a.c(c())},write:a.Da(e)&&
function(a){c()(a)},i:b}):e});g.hasOwnProperty("$raw")||(g.$raw=f);return g}return{$raw:{}}}a.g.getComponentNameForNode=function(b){var c=a.a.A(b);if(a.g.wb(c)&&(-1!=c.indexOf("-")||"[object HTMLUnknownElement]"==""+b||8>=a.a.C&&b.tagName===c))return c};a.g.Rb=function(c,e,f,g){if(1===e.nodeType){var h=a.g.getComponentNameForNode(e);if(h){c=c||{};if(c.component)throw Error('Cannot use the "component" binding on a custom element matching a component');var l={name:h,params:b(e,f)};c.component=g?function(){return l}:
l}}return c};var c=new a.S;9>a.a.C&&(a.g.register=function(a){return function(b){t.createElement(b);return a.apply(this,arguments)}}(a.g.register),t.createDocumentFragment=function(b){return function(){var c=b(),f=a.g.Ec,g;for(g in f)f.hasOwnProperty(g)&&c.createElement(g);return c}}(t.createDocumentFragment))})();(function(b){function c(b,c,d){c=c.template;if(!c)throw Error("Component '"+b+"' has no template");b=a.a.wa(c);a.f.fa(d,b)}function d(a,b,c,d){var e=a.createViewModel;return e?e.call(a,
d,{element:b,templateNodes:c}):d}var e=0;a.d.component={init:function(f,g,h,l,m){function k(){var a=r&&r.dispose;"function"===typeof a&&a.call(r);q=r=null}var r,q,p=a.a.W(a.f.childNodes(f));a.a.G.qa(f,k);a.m(function(){var l=a.a.c(g()),h,v;"string"===typeof l?h=l:(h=a.a.c(l.name),v=a.a.c(l.params));if(!h)throw Error("No component name specified");var n=q=++e;a.g.get(h,function(e){if(q===n){k();if(!e)throw Error("Unknown component '"+h+"'");c(h,e,f);var l=d(e,f,p,v);e=m.createChildContext(l,b,function(a){a.$component=
l;a.$componentTemplateNodes=p});r=l;a.hb(e,f)}})},null,{i:f});return{controlsDescendantBindings:!0}}};a.f.aa.component=!0})();var Q={"class":"className","for":"htmlFor"};a.d.attr={update:function(b,c){var d=a.a.c(c())||{};a.a.D(d,function(c,d){d=a.a.c(d);var g=!1===d||null===d||d===n;g&&b.removeAttribute(c);8>=a.a.C&&c in Q?(c=Q[c],g?b.removeAttribute(c):b[c]=d):g||b.setAttribute(c,d.toString());"name"===c&&a.a.vc(b,g?"":d.toString())})}};(function(){a.d.checked={after:["value","attr"],init:function(b,
c,d){function e(){var e=b.checked,f=p?g():e;if(!a.xa.Va()&&(!l||e)){var h=a.l.w(c);if(k){var m=r?h.p():h;q!==f?(e&&(a.a.ra(m,f,!0),a.a.ra(m,q,!1)),q=f):a.a.ra(m,f,e);r&&a.Da(h)&&h(m)}else a.h.Ga(h,d,"checked",f,!0)}}function f(){var d=a.a.c(c());b.checked=k?0<=a.a.o(d,g()):h?d:g()===d}var g=a.rc(function(){return d.has("checkedValue")?a.a.c(d.get("checkedValue")):d.has("value")?a.a.c(d.get("value")):b.value}),h="checkbox"==b.type,l="radio"==b.type;if(h||l){var m=c(),k=h&&a.a.c(m)instanceof Array,
r=!(k&&m.push&&m.splice),q=k?g():n,p=l||k;l&&!b.name&&a.d.uniqueName.init(b,function(){return!0});a.m(e,null,{i:b});a.a.q(b,"click",e);a.m(f,null,{i:b});m=n}}};a.h.ga.checked=!0;a.d.checkedValue={update:function(b,c){b.value=a.a.c(c())}}})();a.d.css={update:function(b,c){var d=a.a.c(c());null!==d&&"object"==typeof d?a.a.D(d,function(c,d){d=a.a.c(d);a.a.fb(b,c,d)}):(d=a.a.cb(String(d||"")),a.a.fb(b,b.__ko__cssValue,!1),b.__ko__cssValue=d,a.a.fb(b,d,!0))}};a.d.enable={update:function(b,c){var d=a.a.c(c());
d&&b.disabled?b.removeAttribute("disabled"):d||b.disabled||(b.disabled=!0)}};a.d.disable={update:function(b,c){a.d.enable.update(b,function(){return!a.a.c(c())})}};a.d.event={init:function(b,c,d,e,f){var g=c()||{};a.a.D(g,function(g){"string"==typeof g&&a.a.q(b,g,function(b){var m,k=c()[g];if(k){try{var r=a.a.W(arguments);e=f.$data;r.unshift(e);m=k.apply(e,r)}finally{!0!==m&&(b.preventDefault?b.preventDefault():b.returnValue=!1)}!1===d.get(g+"Bubble")&&(b.cancelBubble=!0,b.stopPropagation&&b.stopPropagation())}})})}};
a.d.foreach={mc:function(b){return function(){var c=b(),d=a.a.Bb(c);if(!d||"number"==typeof d.length)return{foreach:c,templateEngine:a.X.vb};a.a.c(c);return{foreach:d.data,as:d.as,includeDestroyed:d.includeDestroyed,afterAdd:d.afterAdd,beforeRemove:d.beforeRemove,afterRender:d.afterRender,beforeMove:d.beforeMove,afterMove:d.afterMove,templateEngine:a.X.vb}}},init:function(b,c){return a.d.template.init(b,a.d.foreach.mc(c))},update:function(b,c,d,e,f){return a.d.template.update(b,a.d.foreach.mc(c),
d,e,f)}};a.h.va.foreach=!1;a.f.aa.foreach=!0;a.d.hasfocus={init:function(b,c,d){function e(e){b.__ko_hasfocusUpdating=!0;var f=b.ownerDocument;if("activeElement"in f){var g;try{g=f.activeElement}catch(k){g=f.body}e=g===b}f=c();a.h.Ga(f,d,"hasfocus",e,!0);b.__ko_hasfocusLastValue=e;b.__ko_hasfocusUpdating=!1}var f=e.bind(null,!0),g=e.bind(null,!1);a.a.q(b,"focus",f);a.a.q(b,"focusin",f);a.a.q(b,"blur",g);a.a.q(b,"focusout",g)},update:function(b,c){var d=!!a.a.c(c());b.__ko_hasfocusUpdating||b.__ko_hasfocusLastValue===
d||(d?b.focus():b.blur(),!d&&b.__ko_hasfocusLastValue&&b.ownerDocument.body.focus(),a.l.w(a.a.Fa,null,[b,d?"focusin":"focusout"]))}};a.h.ga.hasfocus=!0;a.d.hasFocus=a.d.hasfocus;a.h.ga.hasFocus=!0;a.d.html={init:function(){return{controlsDescendantBindings:!0}},update:function(b,c){a.a.Eb(b,c())}};K("if");K("ifnot",!1,!0);K("with",!0,!1,function(a,c){return a.ac(c)});var L={};a.d.options={init:function(b){if("select"!==a.a.A(b))throw Error("options binding applies only to SELECT elements");for(;0<
b.length;)b.remove(0);return{controlsDescendantBindings:!0}},update:function(b,c,d){function e(){return a.a.Ma(b.options,function(a){return a.selected})}function f(a,b,c){var d=typeof b;return"function"==d?b(a):"string"==d?a[b]:c}function g(c,e){if(A&&k)a.j.ja(b,a.a.c(d.get("value")),!0);else if(p.length){var f=0<=a.a.o(p,a.j.u(e[0]));a.a.wc(e[0],f);A&&!f&&a.l.w(a.a.Fa,null,[b,"change"])}}var h=b.multiple,l=0!=b.length&&h?b.scrollTop:null,m=a.a.c(c()),k=d.get("valueAllowUnset")&&d.has("value"),r=
d.get("optionsIncludeDestroyed");c={};var q,p=[];k||(h?p=a.a.ib(e(),a.j.u):0<=b.selectedIndex&&p.push(a.j.u(b.options[b.selectedIndex])));m&&("undefined"==typeof m.length&&(m=[m]),q=a.a.Ma(m,function(b){return r||b===n||null===b||!a.a.c(b._destroy)}),d.has("optionsCaption")&&(m=a.a.c(d.get("optionsCaption")),null!==m&&m!==n&&q.unshift(L)));var A=!1;c.beforeRemove=function(a){b.removeChild(a)};m=g;d.has("optionsAfterRender")&&"function"==typeof d.get("optionsAfterRender")&&(m=function(b,c){g(0,c);
a.l.w(d.get("optionsAfterRender"),null,[c[0],b!==L?b:n])});a.a.Db(b,q,function(c,e,g){g.length&&(p=!k&&g[0].selected?[a.j.u(g[0])]:[],A=!0);e=b.ownerDocument.createElement("option");c===L?(a.a.bb(e,d.get("optionsCaption")),a.j.ja(e,n)):(g=f(c,d.get("optionsValue"),c),a.j.ja(e,a.a.c(g)),c=f(c,d.get("optionsText"),g),a.a.bb(e,c));return[e]},c,m);a.l.w(function(){k?a.j.ja(b,a.a.c(d.get("value")),!0):(h?p.length&&e().length<p.length:p.length&&0<=b.selectedIndex?a.j.u(b.options[b.selectedIndex])!==p[0]:
p.length||0<=b.selectedIndex)&&a.a.Fa(b,"change")});a.a.Sc(b);l&&20<Math.abs(l-b.scrollTop)&&(b.scrollTop=l)}};a.d.options.zb=a.a.e.J();a.d.selectedOptions={after:["options","foreach"],init:function(b,c,d){a.a.q(b,"change",function(){var e=c(),f=[];a.a.r(b.getElementsByTagName("option"),function(b){b.selected&&f.push(a.j.u(b))});a.h.Ga(e,d,"selectedOptions",f)})},update:function(b,c){if("select"!=a.a.A(b))throw Error("values binding applies only to SELECT elements");var d=a.a.c(c()),e=b.scrollTop;
d&&"number"==typeof d.length&&a.a.r(b.getElementsByTagName("option"),function(b){var c=0<=a.a.o(d,a.j.u(b));b.selected!=c&&a.a.wc(b,c)});b.scrollTop=e}};a.h.ga.selectedOptions=!0;a.d.style={update:function(b,c){var d=a.a.c(c()||{});a.a.D(d,function(c,d){d=a.a.c(d);if(null===d||d===n||!1===d)d="";b.style[c]=d})}};a.d.submit={init:function(b,c,d,e,f){if("function"!=typeof c())throw Error("The value for a submit binding must be a function");a.a.q(b,"submit",function(a){var d,e=c();try{d=e.call(f.$data,
b)}finally{!0!==d&&(a.preventDefault?a.preventDefault():a.returnValue=!1)}})}};a.d.text={init:function(){return{controlsDescendantBindings:!0}},update:function(b,c){a.a.bb(b,c())}};a.f.aa.text=!0;(function(){if(x&&x.navigator)var b=function(a){if(a)return parseFloat(a[1])},c=x.opera&&x.opera.version&&parseInt(x.opera.version()),d=x.navigator.userAgent,e=b(d.match(/^(?:(?!chrome).)*version\/([^ ]*) safari/i)),f=b(d.match(/Firefox\/([^ ]*)/));if(10>a.a.C)var g=a.a.e.J(),h=a.a.e.J(),l=function(b){var c=
this.activeElement;(c=c&&a.a.e.get(c,h))&&c(b)},m=function(b,c){var d=b.ownerDocument;a.a.e.get(d,g)||(a.a.e.set(d,g,!0),a.a.q(d,"selectionchange",l));a.a.e.set(b,h,c)};a.d.textInput={init:function(b,d,g){function l(c,d){a.a.q(b,c,d)}function h(){var c=a.a.c(d());if(null===c||c===n)c="";u!==n&&c===u?a.a.setTimeout(h,4):b.value!==c&&(s=c,b.value=c)}function y(){t||(u=b.value,t=a.a.setTimeout(v,4))}function v(){clearTimeout(t);u=t=n;var c=b.value;s!==c&&(s=c,a.h.Ga(d(),g,"textInput",c))}var s=b.value,
t,u,x=9==a.a.C?y:v;10>a.a.C?(l("propertychange",function(a){"value"===a.propertyName&&x(a)}),8==a.a.C&&(l("keyup",v),l("keydown",v)),8<=a.a.C&&(m(b,x),l("dragend",y))):(l("input",v),5>e&&"textarea"===a.a.A(b)?(l("keydown",y),l("paste",y),l("cut",y)):11>c?l("keydown",y):4>f&&(l("DOMAutoComplete",v),l("dragdrop",v),l("drop",v)));l("change",v);a.m(h,null,{i:b})}};a.h.ga.textInput=!0;a.d.textinput={preprocess:function(a,b,c){c("textInput",a)}}})();a.d.uniqueName={init:function(b,c){if(c()){var d="ko_unique_"+
++a.d.uniqueName.Nc;a.a.vc(b,d)}}};a.d.uniqueName.Nc=0;a.d.value={after:["options","foreach"],init:function(b,c,d){if("input"!=b.tagName.toLowerCase()||"checkbox"!=b.type&&"radio"!=b.type){var e=["change"],f=d.get("valueUpdate"),g=!1,h=null;f&&("string"==typeof f&&(f=[f]),a.a.ta(e,f),e=a.a.Wb(e));var l=function(){h=null;g=!1;var e=c(),f=a.j.u(b);a.h.Ga(e,d,"value",f)};!a.a.C||"input"!=b.tagName.toLowerCase()||"text"!=b.type||"off"==b.autocomplete||b.form&&"off"==b.form.autocomplete||-1!=a.a.o(e,"propertychange")||
(a.a.q(b,"propertychange",function(){g=!0}),a.a.q(b,"focus",function(){g=!1}),a.a.q(b,"blur",function(){g&&l()}));a.a.r(e,function(c){var d=l;a.a.sd(c,"after")&&(d=function(){h=a.j.u(b);a.a.setTimeout(l,0)},c=c.substring(5));a.a.q(b,c,d)});var m=function(){var e=a.a.c(c()),f=a.j.u(b);if(null!==h&&e===h)a.a.setTimeout(m,0);else if(e!==f)if("select"===a.a.A(b)){var g=d.get("valueAllowUnset"),f=function(){a.j.ja(b,e,g)};f();g||e===a.j.u(b)?a.a.setTimeout(f,0):a.l.w(a.a.Fa,null,[b,"change"])}else a.j.ja(b,
e)};a.m(m,null,{i:b})}else a.La(b,{checkedValue:c})},update:function(){}};a.h.ga.value=!0;a.d.visible={update:function(b,c){var d=a.a.c(c()),e="none"!=b.style.display;d&&!e?b.style.display="":!d&&e&&(b.style.display="none")}};(function(b){a.d[b]={init:function(c,d,e,f,g){return a.d.event.init.call(this,c,function(){var a={};a[b]=d();return a},e,f,g)}}})("click");a.P=function(){};a.P.prototype.renderTemplateSource=function(){throw Error("Override renderTemplateSource");};a.P.prototype.createJavaScriptEvaluatorBlock=
function(){throw Error("Override createJavaScriptEvaluatorBlock");};a.P.prototype.makeTemplateSource=function(b,c){if("string"==typeof b){c=c||t;var d=c.getElementById(b);if(!d)throw Error("Cannot find template with ID "+b);return new a.v.n(d)}if(1==b.nodeType||8==b.nodeType)return new a.v.sa(b);throw Error("Unknown template type: "+b);};a.P.prototype.renderTemplate=function(a,c,d,e){a=this.makeTemplateSource(a,e);return this.renderTemplateSource(a,c,d,e)};a.P.prototype.isTemplateRewritten=function(a,
c){return!1===this.allowTemplateRewriting?!0:this.makeTemplateSource(a,c).data("isRewritten")};a.P.prototype.rewriteTemplate=function(a,c,d){a=this.makeTemplateSource(a,d);c=c(a.text());a.text(c);a.data("isRewritten",!0)};a.b("templateEngine",a.P);a.Ib=function(){function b(b,c,d,h){b=a.h.Ab(b);for(var l=a.h.va,m=0;m<b.length;m++){var k=b[m].key;if(l.hasOwnProperty(k)){var r=l[k];if("function"===typeof r){if(k=r(b[m].value))throw Error(k);}else if(!r)throw Error("This template engine does not support the '"+
k+"' binding within its templates");}}d="ko.__tr_ambtns(function($context,$element){return(function(){return{ "+a.h.Xa(b,{valueAccessors:!0})+" } })()},'"+d.toLowerCase()+"')";return h.createJavaScriptEvaluatorBlock(d)+c}var c=/(<([a-z]+\d*)(?:\s+(?!data-bind\s*=\s*)[a-z0-9\-]+(?:=(?:\"[^\"]*\"|\'[^\']*\'|[^>]*))?)*\s+)data-bind\s*=\s*(["'])([\s\S]*?)\3/gi,d=/\x3c!--\s*ko\b\s*([\s\S]*?)\s*--\x3e/g;return{Tc:function(b,c,d){c.isTemplateRewritten(b,d)||c.rewriteTemplate(b,function(b){return a.Ib.jd(b,
c)},d)},jd:function(a,f){return a.replace(c,function(a,c,d,e,k){return b(k,c,d,f)}).replace(d,function(a,c){return b(c,"\x3c!-- ko --\x3e","#comment",f)})},Jc:function(b,c){return a.N.yb(function(d,h){var l=d.nextSibling;l&&l.nodeName.toLowerCase()===c&&a.La(l,b,h)})}}}();a.b("__tr_ambtns",a.Ib.Jc);(function(){a.v={};a.v.n=function(b){if(this.n=b){var c=a.a.A(b);this.eb="script"===c?1:"textarea"===c?2:"template"==c&&b.content&&11===b.content.nodeType?3:4}};a.v.n.prototype.text=function(){var b=1===
this.eb?"text":2===this.eb?"value":"innerHTML";if(0==arguments.length)return this.n[b];var c=arguments[0];"innerHTML"===b?a.a.Eb(this.n,c):this.n[b]=c};var b=a.a.e.J()+"_";a.v.n.prototype.data=function(c){if(1===arguments.length)return a.a.e.get(this.n,b+c);a.a.e.set(this.n,b+c,arguments[1])};var c=a.a.e.J();a.v.n.prototype.nodes=function(){var b=this.n;if(0==arguments.length)return(a.a.e.get(b,c)||{}).mb||(3===this.eb?b.content:4===this.eb?b:n);a.a.e.set(b,c,{mb:arguments[0]})};a.v.sa=function(a){this.n=
a};a.v.sa.prototype=new a.v.n;a.v.sa.prototype.text=function(){if(0==arguments.length){var b=a.a.e.get(this.n,c)||{};b.Jb===n&&b.mb&&(b.Jb=b.mb.innerHTML);return b.Jb}a.a.e.set(this.n,c,{Jb:arguments[0]})};a.b("templateSources",a.v);a.b("templateSources.domElement",a.v.n);a.b("templateSources.anonymousTemplate",a.v.sa)})();(function(){function b(b,c,d){var e;for(c=a.f.nextSibling(c);b&&(e=b)!==c;)b=a.f.nextSibling(e),d(e,b)}function c(c,d){if(c.length){var e=c[0],f=c[c.length-1],g=e.parentNode,h=
a.S.instance,n=h.preprocessNode;if(n){b(e,f,function(a,b){var c=a.previousSibling,d=n.call(h,a);d&&(a===e&&(e=d[0]||b),a===f&&(f=d[d.length-1]||c))});c.length=0;if(!e)return;e===f?c.push(e):(c.push(e,f),a.a.Ba(c,g))}b(e,f,function(b){1!==b.nodeType&&8!==b.nodeType||a.Ub(d,b)});b(e,f,function(b){1!==b.nodeType&&8!==b.nodeType||a.N.Cc(b,[d])});a.a.Ba(c,g)}}function d(a){return a.nodeType?a:0<a.length?a[0]:null}function e(b,e,f,h,q){q=q||{};var p=(b&&d(b)||f||{}).ownerDocument,n=q.templateEngine||g;
a.Ib.Tc(f,n,p);f=n.renderTemplate(f,h,q,p);if("number"!=typeof f.length||0<f.length&&"number"!=typeof f[0].nodeType)throw Error("Template engine must return an array of DOM nodes");p=!1;switch(e){case "replaceChildren":a.f.fa(b,f);p=!0;break;case "replaceNode":a.a.uc(b,f);p=!0;break;case "ignoreTargetNode":break;default:throw Error("Unknown renderMode: "+e);}p&&(c(f,h),q.afterRender&&a.l.w(q.afterRender,null,[f,h.$data]));return f}function f(b,c,d){return a.I(b)?b():"function"===typeof b?b(c,d):b}
var g;a.Fb=function(b){if(b!=n&&!(b instanceof a.P))throw Error("templateEngine must inherit from ko.templateEngine");g=b};a.Cb=function(b,c,k,h,q){k=k||{};if((k.templateEngine||g)==n)throw Error("Set a template engine before calling renderTemplate");q=q||"replaceChildren";if(h){var p=d(h);return a.B(function(){var g=c&&c instanceof a.R?c:new a.R(c,null,null,null,{exportDependencies:!0}),n=f(b,g.$data,g),g=e(h,q,n,g,k);"replaceNode"==q&&(h=g,p=d(h))},null,{ya:function(){return!p||!a.a.qb(p)},i:p&&
"replaceNode"==q?p.parentNode:p})}return a.N.yb(function(d){a.Cb(b,c,k,d,"replaceNode")})};a.pd=function(b,d,g,h,q){function p(a,b){c(b,t);g.afterRender&&g.afterRender(b,a);t=null}function s(a,c){t=q.createChildContext(a,g.as,function(a){a.$index=c});var d=f(b,a,t);return e(null,"ignoreTargetNode",d,t,g)}var t;return a.B(function(){var b=a.a.c(d)||[];"undefined"==typeof b.length&&(b=[b]);b=a.a.Ma(b,function(b){return g.includeDestroyed||b===n||null===b||!a.a.c(b._destroy)});a.l.w(a.a.Db,null,[h,b,
s,g,p])},null,{i:h})};var h=a.a.e.J();a.d.template={init:function(b,c){var d=a.a.c(c());if("string"==typeof d||d.name)a.f.za(b);else{if("nodes"in d){if(d=d.nodes||[],a.I(d))throw Error('The "nodes" option must be a plain, non-observable array.');}else d=a.f.childNodes(b);d=a.a.nc(d);(new a.v.sa(b)).nodes(d)}return{controlsDescendantBindings:!0}},update:function(b,c,d,e,f){var g=c();c=a.a.c(g);d=!0;e=null;"string"==typeof c?c={}:(g=c.name,"if"in c&&(d=a.a.c(c["if"])),d&&"ifnot"in c&&(d=!a.a.c(c.ifnot)));
"foreach"in c?e=a.pd(g||b,d&&c.foreach||[],c,b,f):d?(f="data"in c?f.ac(c.data,c.as):f,e=a.Cb(g||b,f,c,b)):a.f.za(b);f=e;(c=a.a.e.get(b,h))&&"function"==typeof c.k&&c.k();a.a.e.set(b,h,f&&f.ca()?f:n)}};a.h.va.template=function(b){b=a.h.Ab(b);return 1==b.length&&b[0].unknown||a.h.fd(b,"name")?null:"This template engine does not support anonymous templates nested within its templates"};a.f.aa.template=!0})();a.b("setTemplateEngine",a.Fb);a.b("renderTemplate",a.Cb);a.a.hc=function(a,c,d){if(a.length&&
c.length){var e,f,g,h,l;for(e=f=0;(!d||e<d)&&(h=a[f]);++f){for(g=0;l=c[g];++g)if(h.value===l.value){h.moved=l.index;l.moved=h.index;c.splice(g,1);e=g=0;break}e+=g}}};a.a.lb=function(){function b(b,d,e,f,g){var h=Math.min,l=Math.max,m=[],k,n=b.length,q,p=d.length,s=p-n||1,t=n+p+1,v,u,x;for(k=0;k<=n;k++)for(u=v,m.push(v=[]),x=h(p,k+s),q=l(0,k-1);q<=x;q++)v[q]=q?k?b[k-1]===d[q-1]?u[q-1]:h(u[q]||t,v[q-1]||t)+1:q+1:k+1;h=[];l=[];s=[];k=n;for(q=p;k||q;)p=m[k][q]-1,q&&p===m[k][q-1]?l.push(h[h.length]={status:e,
value:d[--q],index:q}):k&&p===m[k-1][q]?s.push(h[h.length]={status:f,value:b[--k],index:k}):(--q,--k,g.sparse||h.push({status:"retained",value:d[q]}));a.a.hc(s,l,!g.dontLimitMoves&&10*n);return h.reverse()}return function(a,d,e){e="boolean"===typeof e?{dontLimitMoves:e}:e||{};a=a||[];d=d||[];return a.length<d.length?b(a,d,"added","deleted",e):b(d,a,"deleted","added",e)}}();a.b("utils.compareArrays",a.a.lb);(function(){function b(b,c,d,h,l){var m=[],k=a.B(function(){var k=c(d,l,a.a.Ba(m,b))||[];0<
m.length&&(a.a.uc(m,k),h&&a.l.w(h,null,[d,k,l]));m.length=0;a.a.ta(m,k)},null,{i:b,ya:function(){return!a.a.Tb(m)}});return{ea:m,B:k.ca()?k:n}}var c=a.a.e.J(),d=a.a.e.J();a.a.Db=function(e,f,g,h,l){function m(b,c){w=q[c];u!==c&&(D[b]=w);w.tb(u++);a.a.Ba(w.ea,e);t.push(w);z.push(w)}function k(b,c){if(b)for(var d=0,e=c.length;d<e;d++)c[d]&&a.a.r(c[d].ea,function(a){b(a,d,c[d].ka)})}f=f||[];h=h||{};var r=a.a.e.get(e,c)===n,q=a.a.e.get(e,c)||[],p=a.a.ib(q,function(a){return a.ka}),s=a.a.lb(p,f,h.dontLimitMoves),
t=[],v=0,u=0,x=[],z=[];f=[];for(var D=[],p=[],w,C=0,B,E;B=s[C];C++)switch(E=B.moved,B.status){case "deleted":E===n&&(w=q[v],w.B&&(w.B.k(),w.B=n),a.a.Ba(w.ea,e).length&&(h.beforeRemove&&(t.push(w),z.push(w),w.ka===d?w=null:f[C]=w),w&&x.push.apply(x,w.ea)));v++;break;case "retained":m(C,v++);break;case "added":E!==n?m(C,E):(w={ka:B.value,tb:a.O(u++)},t.push(w),z.push(w),r||(p[C]=w))}a.a.e.set(e,c,t);k(h.beforeMove,D);a.a.r(x,h.beforeRemove?a.ba:a.removeNode);for(var C=0,r=a.f.firstChild(e),F;w=z[C];C++){w.ea||
a.a.extend(w,b(e,g,w.ka,l,w.tb));for(v=0;s=w.ea[v];r=s.nextSibling,F=s,v++)s!==r&&a.f.kc(e,s,F);!w.ad&&l&&(l(w.ka,w.ea,w.tb),w.ad=!0)}k(h.beforeRemove,f);for(C=0;C<f.length;++C)f[C]&&(f[C].ka=d);k(h.afterMove,D);k(h.afterAdd,p)}})();a.b("utils.setDomNodeChildrenFromArrayMapping",a.a.Db);a.X=function(){this.allowTemplateRewriting=!1};a.X.prototype=new a.P;a.X.prototype.renderTemplateSource=function(b,c,d,e){if(c=(9>a.a.C?0:b.nodes)?b.nodes():null)return a.a.W(c.cloneNode(!0).childNodes);b=b.text();
return a.a.na(b,e)};a.X.vb=new a.X;a.Fb(a.X.vb);a.b("nativeTemplateEngine",a.X);(function(){a.xb=function(){var a=this.ed=function(){if(!u||!u.tmpl)return 0;try{if(0<=u.tmpl.tag.tmpl.open.toString().indexOf("__"))return 2}catch(a){}return 1}();this.renderTemplateSource=function(b,e,f,g){g=g||t;f=f||{};if(2>a)throw Error("Your version of jQuery.tmpl is too old. Please upgrade to jQuery.tmpl 1.0.0pre or later.");var h=b.data("precompiled");h||(h=b.text()||"",h=u.template(null,"{{ko_with $item.koBindingContext}}"+
h+"{{/ko_with}}"),b.data("precompiled",h));b=[e.$data];e=u.extend({koBindingContext:e},f.templateOptions);e=u.tmpl(h,b,e);e.appendTo(g.createElement("div"));u.fragments={};return e};this.createJavaScriptEvaluatorBlock=function(a){return"{{ko_code ((function() { return "+a+" })()) }}"};this.addTemplate=function(a,b){t.write("<script type='text/html' id='"+a+"'>"+b+"\x3c/script>")};0<a&&(u.tmpl.tag.ko_code={open:"__.push($1 || '');"},u.tmpl.tag.ko_with={open:"with($1) {",close:"} "})};a.xb.prototype=
new a.P;var b=new a.xb;0<b.ed&&a.Fb(b);a.b("jqueryTmplTemplateEngine",a.xb)})()})})();})();

/// Knockout Mapping plugin v2.4.1
/// (c) 2013 Steven Sanderson, Roy Jacobs - http://knockoutjs.com/
/// License: MIT (http://www.opensource.org/licenses/mit-license.php)
(function(e){"function"===typeof require&&"object"===typeof exports&&"object"===typeof module?e(require("ko"),exports):"function"===typeof define&&define.amd?define('mapping',["ko","exports"],e):e(ko,ko.mapping={})})(function(e,f){function y(b,c){var a,d;for(d in c)if(c.hasOwnProperty(d)&&c[d])if(a=f.getType(b[d]),d&&b[d]&&"array"!==a&&"string"!==a)y(b[d],c[d]);else if("array"===f.getType(b[d])&&"array"===f.getType(c[d])){a=b;for(var e=d,l=b[d],n=c[d],t={},g=l.length-1;0<=g;--g)t[l[g]]=l[g];for(g=
n.length-1;0<=g;--g)t[n[g]]=n[g];l=[];n=void 0;for(n in t)l.push(t[n]);a[e]=l}else b[d]=c[d]}function E(b,c){var a={};y(a,b);y(a,c);return a}function z(b,c){for(var a=E({},b),e=L.length-1;0<=e;e--){var f=L[e];a[f]&&(a[""]instanceof Object||(a[""]={}),a[""][f]=a[f],delete a[f])}c&&(a.ignore=h(c.ignore,a.ignore),a.include=h(c.include,a.include),a.copy=h(c.copy,a.copy),a.observe=h(c.observe,a.observe));a.ignore=h(a.ignore,j.ignore);a.include=h(a.include,j.include);a.copy=h(a.copy,j.copy);a.observe=h(a.observe,
j.observe);a.mappedProperties=a.mappedProperties||{};a.copiedProperties=a.copiedProperties||{};return a}function h(b,c){"array"!==f.getType(b)&&(b="undefined"===f.getType(b)?[]:[b]);"array"!==f.getType(c)&&(c="undefined"===f.getType(c)?[]:[c]);return e.utils.arrayGetDistinctValues(b.concat(c))}function F(b,c,a,d,k,l,n){var t="array"===f.getType(e.utils.unwrapObservable(c));l=l||"";if(f.isMapped(b)){var g=e.utils.unwrapObservable(b)[p];a=E(g,a)}var j=n||k,h=function(){return a[d]&&a[d].create instanceof
Function},x=function(b){var f=G,g=e.dependentObservable;e.dependentObservable=function(a,b,c){c=c||{};a&&"object"==typeof a&&(c=a);var d=c.deferEvaluation,M=!1;c.deferEvaluation=!0;a=new H(a,b,c);if(!d){var g=a,d=e.dependentObservable;e.dependentObservable=H;a=e.isWriteableObservable(g);e.dependentObservable=d;d=H({read:function(){M||(e.utils.arrayRemoveItem(f,g),M=!0);return g.apply(g,arguments)},write:a&&function(a){return g(a)},deferEvaluation:!0});d.__DO=g;a=d;f.push(a)}return a};e.dependentObservable.fn=
H.fn;e.computed=e.dependentObservable;b=e.utils.unwrapObservable(k)instanceof Array?a[d].create({data:b||c,parent:j,skip:N}):a[d].create({data:b||c,parent:j});e.dependentObservable=g;e.computed=e.dependentObservable;return b},u=function(){return a[d]&&a[d].update instanceof Function},v=function(b,f){var g={data:f||c,parent:j,target:e.utils.unwrapObservable(b)};e.isWriteableObservable(b)&&(g.observable=b);return a[d].update(g)};if(n=I.get(c))return n;d=d||"";if(t){var t=[],s=!1,m=function(a){return a};
a[d]&&a[d].key&&(m=a[d].key,s=!0);e.isObservable(b)||(b=e.observableArray([]),b.mappedRemove=function(a){var c="function"==typeof a?a:function(b){return b===m(a)};return b.remove(function(a){return c(m(a))})},b.mappedRemoveAll=function(a){var c=C(a,m);return b.remove(function(a){return-1!=e.utils.arrayIndexOf(c,m(a))})},b.mappedDestroy=function(a){var c="function"==typeof a?a:function(b){return b===m(a)};return b.destroy(function(a){return c(m(a))})},b.mappedDestroyAll=function(a){var c=C(a,m);return b.destroy(function(a){return-1!=
e.utils.arrayIndexOf(c,m(a))})},b.mappedIndexOf=function(a){var c=C(b(),m);a=m(a);return e.utils.arrayIndexOf(c,a)},b.mappedGet=function(a){return b()[b.mappedIndexOf(a)]},b.mappedCreate=function(a){if(-1!==b.mappedIndexOf(a))throw Error("There already is an object with the key that you specified.");var c=h()?x(a):a;u()&&(a=v(c,a),e.isWriteableObservable(c)?c(a):c=a);b.push(c);return c});n=C(e.utils.unwrapObservable(b),m).sort();g=C(c,m);s&&g.sort();s=e.utils.compareArrays(n,g);n={};var J,A=e.utils.unwrapObservable(c),
y={},z=!0,g=0;for(J=A.length;g<J;g++){var r=m(A[g]);if(void 0===r||r instanceof Object){z=!1;break}y[r]=A[g]}var A=[],B=0,g=0;for(J=s.length;g<J;g++){var r=s[g],q,w=l+"["+g+"]";switch(r.status){case "added":var D=z?y[r.value]:K(e.utils.unwrapObservable(c),r.value,m);q=F(void 0,D,a,d,b,w,k);h()||(q=e.utils.unwrapObservable(q));w=O(e.utils.unwrapObservable(c),D,n);q===N?B++:A[w-B]=q;n[w]=!0;break;case "retained":D=z?y[r.value]:K(e.utils.unwrapObservable(c),r.value,m);q=K(b,r.value,m);F(q,D,a,d,b,w,
k);w=O(e.utils.unwrapObservable(c),D,n);A[w]=q;n[w]=!0;break;case "deleted":q=K(b,r.value,m)}t.push({event:r.status,item:q})}b(A);a[d]&&a[d].arrayChanged&&e.utils.arrayForEach(t,function(b){a[d].arrayChanged(b.event,b.item)})}else if(P(c)){b=e.utils.unwrapObservable(b);if(!b){if(h())return s=x(),u()&&(s=v(s)),s;if(u())return v(s);b={}}u()&&(b=v(b));I.save(c,b);if(u())return b;Q(c,function(d){var f=l.length?l+"."+d:d;if(-1==e.utils.arrayIndexOf(a.ignore,f))if(-1!=e.utils.arrayIndexOf(a.copy,f))b[d]=
c[d];else if("object"!=typeof c[d]&&"array"!=typeof c[d]&&0<a.observe.length&&-1==e.utils.arrayIndexOf(a.observe,f))b[d]=c[d],a.copiedProperties[f]=!0;else{var g=I.get(c[d]),k=F(b[d],c[d],a,d,b,f,b),g=g||k;if(0<a.observe.length&&-1==e.utils.arrayIndexOf(a.observe,f))b[d]=g(),a.copiedProperties[f]=!0;else{if(e.isWriteableObservable(b[d])){if(g=e.utils.unwrapObservable(g),b[d]()!==g)b[d](g)}else g=void 0===b[d]?g:e.utils.unwrapObservable(g),b[d]=g;a.mappedProperties[f]=!0}}})}else switch(f.getType(c)){case "function":u()?
e.isWriteableObservable(c)?(c(v(c)),b=c):b=v(c):b=c;break;default:if(e.isWriteableObservable(b))return q=u()?v(b):e.utils.unwrapObservable(c),b(q),q;h()||u();b=h()?x():e.observable(e.utils.unwrapObservable(c));u()&&b(v(b))}return b}function O(b,c,a){for(var d=0,e=b.length;d<e;d++)if(!0!==a[d]&&b[d]===c)return d;return null}function R(b,c){var a;c&&(a=c(b));"undefined"===f.getType(a)&&(a=b);return e.utils.unwrapObservable(a)}function K(b,c,a){b=e.utils.unwrapObservable(b);for(var d=0,f=b.length;d<
f;d++){var l=b[d];if(R(l,a)===c)return l}throw Error("When calling ko.update*, the key '"+c+"' was not found!");}function C(b,c){return e.utils.arrayMap(e.utils.unwrapObservable(b),function(a){return c?R(a,c):a})}function Q(b,c){if("array"===f.getType(b))for(var a=0;a<b.length;a++)c(a);else for(a in b)c(a)}function P(b){var c=f.getType(b);return("object"===c||"array"===c)&&null!==b}function T(){var b=[],c=[];this.save=function(a,d){var f=e.utils.arrayIndexOf(b,a);0<=f?c[f]=d:(b.push(a),c.push(d))};
this.get=function(a){a=e.utils.arrayIndexOf(b,a);return 0<=a?c[a]:void 0}}function S(){var b={},c=function(a){var c;try{c=a}catch(e){c="$$$"}a=b[c];void 0===a&&(a=new T,b[c]=a);return a};this.save=function(a,b){c(a).save(a,b)};this.get=function(a){return c(a).get(a)}}var p="__ko_mapping__",H=e.dependentObservable,B=0,G,I,L=["create","update","key","arrayChanged"],N={},x={include:["_destroy"],ignore:[],copy:[],observe:[]},j=x;f.isMapped=function(b){return(b=e.utils.unwrapObservable(b))&&b[p]};f.fromJS=
function(b){if(0==arguments.length)throw Error("When calling ko.fromJS, pass the object you want to convert.");try{B++||(G=[],I=new S);var c,a;2==arguments.length&&(arguments[1][p]?a=arguments[1]:c=arguments[1]);3==arguments.length&&(c=arguments[1],a=arguments[2]);a&&(c=E(c,a[p]));c=z(c);var d=F(a,b,c);a&&(d=a);if(!--B)for(;G.length;){var e=G.pop();e&&(e(),e.__DO.throttleEvaluation=e.throttleEvaluation)}d[p]=E(d[p],c);return d}catch(f){throw B=0,f;}};f.fromJSON=function(b){var c=e.utils.parseJson(b);
arguments[0]=c;return f.fromJS.apply(this,arguments)};f.updateFromJS=function(){throw Error("ko.mapping.updateFromJS, use ko.mapping.fromJS instead. Please note that the order of parameters is different!");};f.updateFromJSON=function(){throw Error("ko.mapping.updateFromJSON, use ko.mapping.fromJSON instead. Please note that the order of parameters is different!");};f.toJS=function(b,c){j||f.resetDefaultOptions();if(0==arguments.length)throw Error("When calling ko.mapping.toJS, pass the object you want to convert.");
if("array"!==f.getType(j.ignore))throw Error("ko.mapping.defaultOptions().ignore should be an array.");if("array"!==f.getType(j.include))throw Error("ko.mapping.defaultOptions().include should be an array.");if("array"!==f.getType(j.copy))throw Error("ko.mapping.defaultOptions().copy should be an array.");c=z(c,b[p]);return f.visitModel(b,function(a){return e.utils.unwrapObservable(a)},c)};f.toJSON=function(b,c){var a=f.toJS(b,c);return e.utils.stringifyJson(a)};f.defaultOptions=function(){if(0<arguments.length)j=
arguments[0];else return j};f.resetDefaultOptions=function(){j={include:x.include.slice(0),ignore:x.ignore.slice(0),copy:x.copy.slice(0)}};f.getType=function(b){if(b&&"object"===typeof b){if(b.constructor===Date)return"date";if(b.constructor===Array)return"array"}return typeof b};f.visitModel=function(b,c,a){a=a||{};a.visitedObjects=a.visitedObjects||new S;var d,k=e.utils.unwrapObservable(b);if(P(k))a=z(a,k[p]),c(b,a.parentName),d="array"===f.getType(k)?[]:{};else return c(b,a.parentName);a.visitedObjects.save(b,
d);var l=a.parentName;Q(k,function(b){if(!(a.ignore&&-1!=e.utils.arrayIndexOf(a.ignore,b))){var j=k[b],g=a,h=l||"";"array"===f.getType(k)?l&&(h+="["+b+"]"):(l&&(h+="."),h+=b);g.parentName=h;if(!(-1===e.utils.arrayIndexOf(a.copy,b)&&-1===e.utils.arrayIndexOf(a.include,b)&&k[p]&&k[p].mappedProperties&&!k[p].mappedProperties[b]&&k[p].copiedProperties&&!k[p].copiedProperties[b]&&"array"!==f.getType(k)))switch(f.getType(e.utils.unwrapObservable(j))){case "object":case "array":case "undefined":g=a.visitedObjects.get(j);
d[b]="undefined"!==f.getType(g)?g:f.visitModel(j,c,a);break;default:d[b]=c(j,a.parentName)}}});return d}});

/*! jQuery v3.4.1 | (c) JS Foundation and other contributors | jquery.org/license */
!function(e,t){"use strict";"object"==typeof module&&"object"==typeof module.exports?module.exports=e.document?t(e,!0):function(e){if(!e.document)throw new Error("jQuery requires a window with a document");return t(e)}:t(e)}("undefined"!=typeof window?window:this,function(C,e){"use strict";var t=[],E=C.document,r=Object.getPrototypeOf,s=t.slice,g=t.concat,u=t.push,i=t.indexOf,n={},o=n.toString,v=n.hasOwnProperty,a=v.toString,l=a.call(Object),y={},m=function(e){return"function"==typeof e&&"number"!=typeof e.nodeType},x=function(e){return null!=e&&e===e.window},c={type:!0,src:!0,nonce:!0,noModule:!0};function b(e,t,n){var r,i,o=(n=n||E).createElement("script");if(o.text=e,t)for(r in c)(i=t[r]||t.getAttribute&&t.getAttribute(r))&&o.setAttribute(r,i);n.head.appendChild(o).parentNode.removeChild(o)}function w(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?n[o.call(e)]||"object":typeof e}var f="3.4.1",k=function(e,t){return new k.fn.init(e,t)},p=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;function d(e){var t=!!e&&"length"in e&&e.length,n=w(e);return!m(e)&&!x(e)&&("array"===n||0===t||"number"==typeof t&&0<t&&t-1 in e)}k.fn=k.prototype={jquery:f,constructor:k,length:0,toArray:function(){return s.call(this)},get:function(e){return null==e?s.call(this):e<0?this[e+this.length]:this[e]},pushStack:function(e){var t=k.merge(this.constructor(),e);return t.prevObject=this,t},each:function(e){return k.each(this,e)},map:function(n){return this.pushStack(k.map(this,function(e,t){return n.call(e,t,e)}))},slice:function(){return this.pushStack(s.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(e){var t=this.length,n=+e+(e<0?t:0);return this.pushStack(0<=n&&n<t?[this[n]]:[])},end:function(){return this.prevObject||this.constructor()},push:u,sort:t.sort,splice:t.splice},k.extend=k.fn.extend=function(){var e,t,n,r,i,o,a=arguments[0]||{},s=1,u=arguments.length,l=!1;for("boolean"==typeof a&&(l=a,a=arguments[s]||{},s++),"object"==typeof a||m(a)||(a={}),s===u&&(a=this,s--);s<u;s++)if(null!=(e=arguments[s]))for(t in e)r=e[t],"__proto__"!==t&&a!==r&&(l&&r&&(k.isPlainObject(r)||(i=Array.isArray(r)))?(n=a[t],o=i&&!Array.isArray(n)?[]:i||k.isPlainObject(n)?n:{},i=!1,a[t]=k.extend(l,o,r)):void 0!==r&&(a[t]=r));return a},k.extend({expando:"jQuery"+(f+Math.random()).replace(/\D/g,""),isReady:!0,error:function(e){throw new Error(e)},noop:function(){},isPlainObject:function(e){var t,n;return!(!e||"[object Object]"!==o.call(e))&&(!(t=r(e))||"function"==typeof(n=v.call(t,"constructor")&&t.constructor)&&a.call(n)===l)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},globalEval:function(e,t){b(e,{nonce:t&&t.nonce})},each:function(e,t){var n,r=0;if(d(e)){for(n=e.length;r<n;r++)if(!1===t.call(e[r],r,e[r]))break}else for(r in e)if(!1===t.call(e[r],r,e[r]))break;return e},trim:function(e){return null==e?"":(e+"").replace(p,"")},makeArray:function(e,t){var n=t||[];return null!=e&&(d(Object(e))?k.merge(n,"string"==typeof e?[e]:e):u.call(n,e)),n},inArray:function(e,t,n){return null==t?-1:i.call(t,e,n)},merge:function(e,t){for(var n=+t.length,r=0,i=e.length;r<n;r++)e[i++]=t[r];return e.length=i,e},grep:function(e,t,n){for(var r=[],i=0,o=e.length,a=!n;i<o;i++)!t(e[i],i)!==a&&r.push(e[i]);return r},map:function(e,t,n){var r,i,o=0,a=[];if(d(e))for(r=e.length;o<r;o++)null!=(i=t(e[o],o,n))&&a.push(i);else for(o in e)null!=(i=t(e[o],o,n))&&a.push(i);return g.apply([],a)},guid:1,support:y}),"function"==typeof Symbol&&(k.fn[Symbol.iterator]=t[Symbol.iterator]),k.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),function(e,t){n["[object "+t+"]"]=t.toLowerCase()});var h=function(n){var e,d,b,o,i,h,f,g,w,u,l,T,C,a,E,v,s,c,y,k="sizzle"+1*new Date,m=n.document,S=0,r=0,p=ue(),x=ue(),N=ue(),A=ue(),D=function(e,t){return e===t&&(l=!0),0},j={}.hasOwnProperty,t=[],q=t.pop,L=t.push,H=t.push,O=t.slice,P=function(e,t){for(var n=0,r=e.length;n<r;n++)if(e[n]===t)return n;return-1},R="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",M="[\\x20\\t\\r\\n\\f]",I="(?:\\\\.|[\\w-]|[^\0-\\xa0])+",W="\\["+M+"*("+I+")(?:"+M+"*([*^$|!~]?=)"+M+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+I+"))|)"+M+"*\\]",$=":("+I+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+W+")*)|.*)\\)|)",F=new RegExp(M+"+","g"),B=new RegExp("^"+M+"+|((?:^|[^\\\\])(?:\\\\.)*)"+M+"+$","g"),_=new RegExp("^"+M+"*,"+M+"*"),z=new RegExp("^"+M+"*([>+~]|"+M+")"+M+"*"),U=new RegExp(M+"|>"),X=new RegExp($),V=new RegExp("^"+I+"$"),G={ID:new RegExp("^#("+I+")"),CLASS:new RegExp("^\\.("+I+")"),TAG:new RegExp("^("+I+"|[*])"),ATTR:new RegExp("^"+W),PSEUDO:new RegExp("^"+$),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+M+"*(even|odd|(([+-]|)(\\d*)n|)"+M+"*(?:([+-]|)"+M+"*(\\d+)|))"+M+"*\\)|)","i"),bool:new RegExp("^(?:"+R+")$","i"),needsContext:new RegExp("^"+M+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+M+"*((?:-\\d)?\\d*)"+M+"*\\)|)(?=[^-]|$)","i")},Y=/HTML$/i,Q=/^(?:input|select|textarea|button)$/i,J=/^h\d$/i,K=/^[^{]+\{\s*\[native \w/,Z=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,ee=/[+~]/,te=new RegExp("\\\\([\\da-f]{1,6}"+M+"?|("+M+")|.)","ig"),ne=function(e,t,n){var r="0x"+t-65536;return r!=r||n?t:r<0?String.fromCharCode(r+65536):String.fromCharCode(r>>10|55296,1023&r|56320)},re=/([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,ie=function(e,t){return t?"\0"===e?"\ufffd":e.slice(0,-1)+"\\"+e.charCodeAt(e.length-1).toString(16)+" ":"\\"+e},oe=function(){T()},ae=be(function(e){return!0===e.disabled&&"fieldset"===e.nodeName.toLowerCase()},{dir:"parentNode",next:"legend"});try{H.apply(t=O.call(m.childNodes),m.childNodes),t[m.childNodes.length].nodeType}catch(e){H={apply:t.length?function(e,t){L.apply(e,O.call(t))}:function(e,t){var n=e.length,r=0;while(e[n++]=t[r++]);e.length=n-1}}}function se(t,e,n,r){var i,o,a,s,u,l,c,f=e&&e.ownerDocument,p=e?e.nodeType:9;if(n=n||[],"string"!=typeof t||!t||1!==p&&9!==p&&11!==p)return n;if(!r&&((e?e.ownerDocument||e:m)!==C&&T(e),e=e||C,E)){if(11!==p&&(u=Z.exec(t)))if(i=u[1]){if(9===p){if(!(a=e.getElementById(i)))return n;if(a.id===i)return n.push(a),n}else if(f&&(a=f.getElementById(i))&&y(e,a)&&a.id===i)return n.push(a),n}else{if(u[2])return H.apply(n,e.getElementsByTagName(t)),n;if((i=u[3])&&d.getElementsByClassName&&e.getElementsByClassName)return H.apply(n,e.getElementsByClassName(i)),n}if(d.qsa&&!A[t+" "]&&(!v||!v.test(t))&&(1!==p||"object"!==e.nodeName.toLowerCase())){if(c=t,f=e,1===p&&U.test(t)){(s=e.getAttribute("id"))?s=s.replace(re,ie):e.setAttribute("id",s=k),o=(l=h(t)).length;while(o--)l[o]="#"+s+" "+xe(l[o]);c=l.join(","),f=ee.test(t)&&ye(e.parentNode)||e}try{return H.apply(n,f.querySelectorAll(c)),n}catch(e){A(t,!0)}finally{s===k&&e.removeAttribute("id")}}}return g(t.replace(B,"$1"),e,n,r)}function ue(){var r=[];return function e(t,n){return r.push(t+" ")>b.cacheLength&&delete e[r.shift()],e[t+" "]=n}}function le(e){return e[k]=!0,e}function ce(e){var t=C.createElement("fieldset");try{return!!e(t)}catch(e){return!1}finally{t.parentNode&&t.parentNode.removeChild(t),t=null}}function fe(e,t){var n=e.split("|"),r=n.length;while(r--)b.attrHandle[n[r]]=t}function pe(e,t){var n=t&&e,r=n&&1===e.nodeType&&1===t.nodeType&&e.sourceIndex-t.sourceIndex;if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function de(t){return function(e){return"input"===e.nodeName.toLowerCase()&&e.type===t}}function he(n){return function(e){var t=e.nodeName.toLowerCase();return("input"===t||"button"===t)&&e.type===n}}function ge(t){return function(e){return"form"in e?e.parentNode&&!1===e.disabled?"label"in e?"label"in e.parentNode?e.parentNode.disabled===t:e.disabled===t:e.isDisabled===t||e.isDisabled!==!t&&ae(e)===t:e.disabled===t:"label"in e&&e.disabled===t}}function ve(a){return le(function(o){return o=+o,le(function(e,t){var n,r=a([],e.length,o),i=r.length;while(i--)e[n=r[i]]&&(e[n]=!(t[n]=e[n]))})})}function ye(e){return e&&"undefined"!=typeof e.getElementsByTagName&&e}for(e in d=se.support={},i=se.isXML=function(e){var t=e.namespaceURI,n=(e.ownerDocument||e).documentElement;return!Y.test(t||n&&n.nodeName||"HTML")},T=se.setDocument=function(e){var t,n,r=e?e.ownerDocument||e:m;return r!==C&&9===r.nodeType&&r.documentElement&&(a=(C=r).documentElement,E=!i(C),m!==C&&(n=C.defaultView)&&n.top!==n&&(n.addEventListener?n.addEventListener("unload",oe,!1):n.attachEvent&&n.attachEvent("onunload",oe)),d.attributes=ce(function(e){return e.className="i",!e.getAttribute("className")}),d.getElementsByTagName=ce(function(e){return e.appendChild(C.createComment("")),!e.getElementsByTagName("*").length}),d.getElementsByClassName=K.test(C.getElementsByClassName),d.getById=ce(function(e){return a.appendChild(e).id=k,!C.getElementsByName||!C.getElementsByName(k).length}),d.getById?(b.filter.ID=function(e){var t=e.replace(te,ne);return function(e){return e.getAttribute("id")===t}},b.find.ID=function(e,t){if("undefined"!=typeof t.getElementById&&E){var n=t.getElementById(e);return n?[n]:[]}}):(b.filter.ID=function(e){var n=e.replace(te,ne);return function(e){var t="undefined"!=typeof e.getAttributeNode&&e.getAttributeNode("id");return t&&t.value===n}},b.find.ID=function(e,t){if("undefined"!=typeof t.getElementById&&E){var n,r,i,o=t.getElementById(e);if(o){if((n=o.getAttributeNode("id"))&&n.value===e)return[o];i=t.getElementsByName(e),r=0;while(o=i[r++])if((n=o.getAttributeNode("id"))&&n.value===e)return[o]}return[]}}),b.find.TAG=d.getElementsByTagName?function(e,t){return"undefined"!=typeof t.getElementsByTagName?t.getElementsByTagName(e):d.qsa?t.querySelectorAll(e):void 0}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},b.find.CLASS=d.getElementsByClassName&&function(e,t){if("undefined"!=typeof t.getElementsByClassName&&E)return t.getElementsByClassName(e)},s=[],v=[],(d.qsa=K.test(C.querySelectorAll))&&(ce(function(e){a.appendChild(e).innerHTML="<a id='"+k+"'></a><select id='"+k+"-\r\\' msallowcapture=''><option selected=''></option></select>",e.querySelectorAll("[msallowcapture^='']").length&&v.push("[*^$]="+M+"*(?:''|\"\")"),e.querySelectorAll("[selected]").length||v.push("\\["+M+"*(?:value|"+R+")"),e.querySelectorAll("[id~="+k+"-]").length||v.push("~="),e.querySelectorAll(":checked").length||v.push(":checked"),e.querySelectorAll("a#"+k+"+*").length||v.push(".#.+[+~]")}),ce(function(e){e.innerHTML="<a href='' disabled='disabled'></a><select disabled='disabled'><option/></select>";var t=C.createElement("input");t.setAttribute("type","hidden"),e.appendChild(t).setAttribute("name","D"),e.querySelectorAll("[name=d]").length&&v.push("name"+M+"*[*^$|!~]?="),2!==e.querySelectorAll(":enabled").length&&v.push(":enabled",":disabled"),a.appendChild(e).disabled=!0,2!==e.querySelectorAll(":disabled").length&&v.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),v.push(",.*:")})),(d.matchesSelector=K.test(c=a.matches||a.webkitMatchesSelector||a.mozMatchesSelector||a.oMatchesSelector||a.msMatchesSelector))&&ce(function(e){d.disconnectedMatch=c.call(e,"*"),c.call(e,"[s!='']:x"),s.push("!=",$)}),v=v.length&&new RegExp(v.join("|")),s=s.length&&new RegExp(s.join("|")),t=K.test(a.compareDocumentPosition),y=t||K.test(a.contains)?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},D=t?function(e,t){if(e===t)return l=!0,0;var n=!e.compareDocumentPosition-!t.compareDocumentPosition;return n||(1&(n=(e.ownerDocument||e)===(t.ownerDocument||t)?e.compareDocumentPosition(t):1)||!d.sortDetached&&t.compareDocumentPosition(e)===n?e===C||e.ownerDocument===m&&y(m,e)?-1:t===C||t.ownerDocument===m&&y(m,t)?1:u?P(u,e)-P(u,t):0:4&n?-1:1)}:function(e,t){if(e===t)return l=!0,0;var n,r=0,i=e.parentNode,o=t.parentNode,a=[e],s=[t];if(!i||!o)return e===C?-1:t===C?1:i?-1:o?1:u?P(u,e)-P(u,t):0;if(i===o)return pe(e,t);n=e;while(n=n.parentNode)a.unshift(n);n=t;while(n=n.parentNode)s.unshift(n);while(a[r]===s[r])r++;return r?pe(a[r],s[r]):a[r]===m?-1:s[r]===m?1:0}),C},se.matches=function(e,t){return se(e,null,null,t)},se.matchesSelector=function(e,t){if((e.ownerDocument||e)!==C&&T(e),d.matchesSelector&&E&&!A[t+" "]&&(!s||!s.test(t))&&(!v||!v.test(t)))try{var n=c.call(e,t);if(n||d.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(e){A(t,!0)}return 0<se(t,C,null,[e]).length},se.contains=function(e,t){return(e.ownerDocument||e)!==C&&T(e),y(e,t)},se.attr=function(e,t){(e.ownerDocument||e)!==C&&T(e);var n=b.attrHandle[t.toLowerCase()],r=n&&j.call(b.attrHandle,t.toLowerCase())?n(e,t,!E):void 0;return void 0!==r?r:d.attributes||!E?e.getAttribute(t):(r=e.getAttributeNode(t))&&r.specified?r.value:null},se.escape=function(e){return(e+"").replace(re,ie)},se.error=function(e){throw new Error("Syntax error, unrecognized expression: "+e)},se.uniqueSort=function(e){var t,n=[],r=0,i=0;if(l=!d.detectDuplicates,u=!d.sortStable&&e.slice(0),e.sort(D),l){while(t=e[i++])t===e[i]&&(r=n.push(i));while(r--)e.splice(n[r],1)}return u=null,e},o=se.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=o(e)}else if(3===i||4===i)return e.nodeValue}else while(t=e[r++])n+=o(t);return n},(b=se.selectors={cacheLength:50,createPseudo:le,match:G,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(te,ne),e[3]=(e[3]||e[4]||e[5]||"").replace(te,ne),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||se.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&se.error(e[0]),e},PSEUDO:function(e){var t,n=!e[6]&&e[2];return G.CHILD.test(e[0])?null:(e[3]?e[2]=e[4]||e[5]||"":n&&X.test(n)&&(t=h(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){var t=e.replace(te,ne).toLowerCase();return"*"===e?function(){return!0}:function(e){return e.nodeName&&e.nodeName.toLowerCase()===t}},CLASS:function(e){var t=p[e+" "];return t||(t=new RegExp("(^|"+M+")"+e+"("+M+"|$)"))&&p(e,function(e){return t.test("string"==typeof e.className&&e.className||"undefined"!=typeof e.getAttribute&&e.getAttribute("class")||"")})},ATTR:function(n,r,i){return function(e){var t=se.attr(e,n);return null==t?"!="===r:!r||(t+="","="===r?t===i:"!="===r?t!==i:"^="===r?i&&0===t.indexOf(i):"*="===r?i&&-1<t.indexOf(i):"$="===r?i&&t.slice(-i.length)===i:"~="===r?-1<(" "+t.replace(F," ")+" ").indexOf(i):"|="===r&&(t===i||t.slice(0,i.length+1)===i+"-"))}},CHILD:function(h,e,t,g,v){var y="nth"!==h.slice(0,3),m="last"!==h.slice(-4),x="of-type"===e;return 1===g&&0===v?function(e){return!!e.parentNode}:function(e,t,n){var r,i,o,a,s,u,l=y!==m?"nextSibling":"previousSibling",c=e.parentNode,f=x&&e.nodeName.toLowerCase(),p=!n&&!x,d=!1;if(c){if(y){while(l){a=e;while(a=a[l])if(x?a.nodeName.toLowerCase()===f:1===a.nodeType)return!1;u=l="only"===h&&!u&&"nextSibling"}return!0}if(u=[m?c.firstChild:c.lastChild],m&&p){d=(s=(r=(i=(o=(a=c)[k]||(a[k]={}))[a.uniqueID]||(o[a.uniqueID]={}))[h]||[])[0]===S&&r[1])&&r[2],a=s&&c.childNodes[s];while(a=++s&&a&&a[l]||(d=s=0)||u.pop())if(1===a.nodeType&&++d&&a===e){i[h]=[S,s,d];break}}else if(p&&(d=s=(r=(i=(o=(a=e)[k]||(a[k]={}))[a.uniqueID]||(o[a.uniqueID]={}))[h]||[])[0]===S&&r[1]),!1===d)while(a=++s&&a&&a[l]||(d=s=0)||u.pop())if((x?a.nodeName.toLowerCase()===f:1===a.nodeType)&&++d&&(p&&((i=(o=a[k]||(a[k]={}))[a.uniqueID]||(o[a.uniqueID]={}))[h]=[S,d]),a===e))break;return(d-=v)===g||d%g==0&&0<=d/g}}},PSEUDO:function(e,o){var t,a=b.pseudos[e]||b.setFilters[e.toLowerCase()]||se.error("unsupported pseudo: "+e);return a[k]?a(o):1<a.length?(t=[e,e,"",o],b.setFilters.hasOwnProperty(e.toLowerCase())?le(function(e,t){var n,r=a(e,o),i=r.length;while(i--)e[n=P(e,r[i])]=!(t[n]=r[i])}):function(e){return a(e,0,t)}):a}},pseudos:{not:le(function(e){var r=[],i=[],s=f(e.replace(B,"$1"));return s[k]?le(function(e,t,n,r){var i,o=s(e,null,r,[]),a=e.length;while(a--)(i=o[a])&&(e[a]=!(t[a]=i))}):function(e,t,n){return r[0]=e,s(r,null,n,i),r[0]=null,!i.pop()}}),has:le(function(t){return function(e){return 0<se(t,e).length}}),contains:le(function(t){return t=t.replace(te,ne),function(e){return-1<(e.textContent||o(e)).indexOf(t)}}),lang:le(function(n){return V.test(n||"")||se.error("unsupported lang: "+n),n=n.replace(te,ne).toLowerCase(),function(e){var t;do{if(t=E?e.lang:e.getAttribute("xml:lang")||e.getAttribute("lang"))return(t=t.toLowerCase())===n||0===t.indexOf(n+"-")}while((e=e.parentNode)&&1===e.nodeType);return!1}}),target:function(e){var t=n.location&&n.location.hash;return t&&t.slice(1)===e.id},root:function(e){return e===a},focus:function(e){return e===C.activeElement&&(!C.hasFocus||C.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:ge(!1),disabled:ge(!0),checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,!0===e.selected},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeType<6)return!1;return!0},parent:function(e){return!b.pseudos.empty(e)},header:function(e){return J.test(e.nodeName)},input:function(e){return Q.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||"text"===t.toLowerCase())},first:ve(function(){return[0]}),last:ve(function(e,t){return[t-1]}),eq:ve(function(e,t,n){return[n<0?n+t:n]}),even:ve(function(e,t){for(var n=0;n<t;n+=2)e.push(n);return e}),odd:ve(function(e,t){for(var n=1;n<t;n+=2)e.push(n);return e}),lt:ve(function(e,t,n){for(var r=n<0?n+t:t<n?t:n;0<=--r;)e.push(r);return e}),gt:ve(function(e,t,n){for(var r=n<0?n+t:n;++r<t;)e.push(r);return e})}}).pseudos.nth=b.pseudos.eq,{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})b.pseudos[e]=de(e);for(e in{submit:!0,reset:!0})b.pseudos[e]=he(e);function me(){}function xe(e){for(var t=0,n=e.length,r="";t<n;t++)r+=e[t].value;return r}function be(s,e,t){var u=e.dir,l=e.next,c=l||u,f=t&&"parentNode"===c,p=r++;return e.first?function(e,t,n){while(e=e[u])if(1===e.nodeType||f)return s(e,t,n);return!1}:function(e,t,n){var r,i,o,a=[S,p];if(n){while(e=e[u])if((1===e.nodeType||f)&&s(e,t,n))return!0}else while(e=e[u])if(1===e.nodeType||f)if(i=(o=e[k]||(e[k]={}))[e.uniqueID]||(o[e.uniqueID]={}),l&&l===e.nodeName.toLowerCase())e=e[u]||e;else{if((r=i[c])&&r[0]===S&&r[1]===p)return a[2]=r[2];if((i[c]=a)[2]=s(e,t,n))return!0}return!1}}function we(i){return 1<i.length?function(e,t,n){var r=i.length;while(r--)if(!i[r](e,t,n))return!1;return!0}:i[0]}function Te(e,t,n,r,i){for(var o,a=[],s=0,u=e.length,l=null!=t;s<u;s++)(o=e[s])&&(n&&!n(o,r,i)||(a.push(o),l&&t.push(s)));return a}function Ce(d,h,g,v,y,e){return v&&!v[k]&&(v=Ce(v)),y&&!y[k]&&(y=Ce(y,e)),le(function(e,t,n,r){var i,o,a,s=[],u=[],l=t.length,c=e||function(e,t,n){for(var r=0,i=t.length;r<i;r++)se(e,t[r],n);return n}(h||"*",n.nodeType?[n]:n,[]),f=!d||!e&&h?c:Te(c,s,d,n,r),p=g?y||(e?d:l||v)?[]:t:f;if(g&&g(f,p,n,r),v){i=Te(p,u),v(i,[],n,r),o=i.length;while(o--)(a=i[o])&&(p[u[o]]=!(f[u[o]]=a))}if(e){if(y||d){if(y){i=[],o=p.length;while(o--)(a=p[o])&&i.push(f[o]=a);y(null,p=[],i,r)}o=p.length;while(o--)(a=p[o])&&-1<(i=y?P(e,a):s[o])&&(e[i]=!(t[i]=a))}}else p=Te(p===t?p.splice(l,p.length):p),y?y(null,t,p,r):H.apply(t,p)})}function Ee(e){for(var i,t,n,r=e.length,o=b.relative[e[0].type],a=o||b.relative[" "],s=o?1:0,u=be(function(e){return e===i},a,!0),l=be(function(e){return-1<P(i,e)},a,!0),c=[function(e,t,n){var r=!o&&(n||t!==w)||((i=t).nodeType?u(e,t,n):l(e,t,n));return i=null,r}];s<r;s++)if(t=b.relative[e[s].type])c=[be(we(c),t)];else{if((t=b.filter[e[s].type].apply(null,e[s].matches))[k]){for(n=++s;n<r;n++)if(b.relative[e[n].type])break;return Ce(1<s&&we(c),1<s&&xe(e.slice(0,s-1).concat({value:" "===e[s-2].type?"*":""})).replace(B,"$1"),t,s<n&&Ee(e.slice(s,n)),n<r&&Ee(e=e.slice(n)),n<r&&xe(e))}c.push(t)}return we(c)}return me.prototype=b.filters=b.pseudos,b.setFilters=new me,h=se.tokenize=function(e,t){var n,r,i,o,a,s,u,l=x[e+" "];if(l)return t?0:l.slice(0);a=e,s=[],u=b.preFilter;while(a){for(o in n&&!(r=_.exec(a))||(r&&(a=a.slice(r[0].length)||a),s.push(i=[])),n=!1,(r=z.exec(a))&&(n=r.shift(),i.push({value:n,type:r[0].replace(B," ")}),a=a.slice(n.length)),b.filter)!(r=G[o].exec(a))||u[o]&&!(r=u[o](r))||(n=r.shift(),i.push({value:n,type:o,matches:r}),a=a.slice(n.length));if(!n)break}return t?a.length:a?se.error(e):x(e,s).slice(0)},f=se.compile=function(e,t){var n,v,y,m,x,r,i=[],o=[],a=N[e+" "];if(!a){t||(t=h(e)),n=t.length;while(n--)(a=Ee(t[n]))[k]?i.push(a):o.push(a);(a=N(e,(v=o,m=0<(y=i).length,x=0<v.length,r=function(e,t,n,r,i){var o,a,s,u=0,l="0",c=e&&[],f=[],p=w,d=e||x&&b.find.TAG("*",i),h=S+=null==p?1:Math.random()||.1,g=d.length;for(i&&(w=t===C||t||i);l!==g&&null!=(o=d[l]);l++){if(x&&o){a=0,t||o.ownerDocument===C||(T(o),n=!E);while(s=v[a++])if(s(o,t||C,n)){r.push(o);break}i&&(S=h)}m&&((o=!s&&o)&&u--,e&&c.push(o))}if(u+=l,m&&l!==u){a=0;while(s=y[a++])s(c,f,t,n);if(e){if(0<u)while(l--)c[l]||f[l]||(f[l]=q.call(r));f=Te(f)}H.apply(r,f),i&&!e&&0<f.length&&1<u+y.length&&se.uniqueSort(r)}return i&&(S=h,w=p),c},m?le(r):r))).selector=e}return a},g=se.select=function(e,t,n,r){var i,o,a,s,u,l="function"==typeof e&&e,c=!r&&h(e=l.selector||e);if(n=n||[],1===c.length){if(2<(o=c[0]=c[0].slice(0)).length&&"ID"===(a=o[0]).type&&9===t.nodeType&&E&&b.relative[o[1].type]){if(!(t=(b.find.ID(a.matches[0].replace(te,ne),t)||[])[0]))return n;l&&(t=t.parentNode),e=e.slice(o.shift().value.length)}i=G.needsContext.test(e)?0:o.length;while(i--){if(a=o[i],b.relative[s=a.type])break;if((u=b.find[s])&&(r=u(a.matches[0].replace(te,ne),ee.test(o[0].type)&&ye(t.parentNode)||t))){if(o.splice(i,1),!(e=r.length&&xe(o)))return H.apply(n,r),n;break}}}return(l||f(e,c))(r,t,!E,n,!t||ee.test(e)&&ye(t.parentNode)||t),n},d.sortStable=k.split("").sort(D).join("")===k,d.detectDuplicates=!!l,T(),d.sortDetached=ce(function(e){return 1&e.compareDocumentPosition(C.createElement("fieldset"))}),ce(function(e){return e.innerHTML="<a href='#'></a>","#"===e.firstChild.getAttribute("href")})||fe("type|href|height|width",function(e,t,n){if(!n)return e.getAttribute(t,"type"===t.toLowerCase()?1:2)}),d.attributes&&ce(function(e){return e.innerHTML="<input/>",e.firstChild.setAttribute("value",""),""===e.firstChild.getAttribute("value")})||fe("value",function(e,t,n){if(!n&&"input"===e.nodeName.toLowerCase())return e.defaultValue}),ce(function(e){return null==e.getAttribute("disabled")})||fe(R,function(e,t,n){var r;if(!n)return!0===e[t]?t.toLowerCase():(r=e.getAttributeNode(t))&&r.specified?r.value:null}),se}(C);k.find=h,k.expr=h.selectors,k.expr[":"]=k.expr.pseudos,k.uniqueSort=k.unique=h.uniqueSort,k.text=h.getText,k.isXMLDoc=h.isXML,k.contains=h.contains,k.escapeSelector=h.escape;var T=function(e,t,n){var r=[],i=void 0!==n;while((e=e[t])&&9!==e.nodeType)if(1===e.nodeType){if(i&&k(e).is(n))break;r.push(e)}return r},S=function(e,t){for(var n=[];e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n},N=k.expr.match.needsContext;function A(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()}var D=/^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;function j(e,n,r){return m(n)?k.grep(e,function(e,t){return!!n.call(e,t,e)!==r}):n.nodeType?k.grep(e,function(e){return e===n!==r}):"string"!=typeof n?k.grep(e,function(e){return-1<i.call(n,e)!==r}):k.filter(n,e,r)}k.filter=function(e,t,n){var r=t[0];return n&&(e=":not("+e+")"),1===t.length&&1===r.nodeType?k.find.matchesSelector(r,e)?[r]:[]:k.find.matches(e,k.grep(t,function(e){return 1===e.nodeType}))},k.fn.extend({find:function(e){var t,n,r=this.length,i=this;if("string"!=typeof e)return this.pushStack(k(e).filter(function(){for(t=0;t<r;t++)if(k.contains(i[t],this))return!0}));for(n=this.pushStack([]),t=0;t<r;t++)k.find(e,i[t],n);return 1<r?k.uniqueSort(n):n},filter:function(e){return this.pushStack(j(this,e||[],!1))},not:function(e){return this.pushStack(j(this,e||[],!0))},is:function(e){return!!j(this,"string"==typeof e&&N.test(e)?k(e):e||[],!1).length}});var q,L=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;(k.fn.init=function(e,t,n){var r,i;if(!e)return this;if(n=n||q,"string"==typeof e){if(!(r="<"===e[0]&&">"===e[e.length-1]&&3<=e.length?[null,e,null]:L.exec(e))||!r[1]&&t)return!t||t.jquery?(t||n).find(e):this.constructor(t).find(e);if(r[1]){if(t=t instanceof k?t[0]:t,k.merge(this,k.parseHTML(r[1],t&&t.nodeType?t.ownerDocument||t:E,!0)),D.test(r[1])&&k.isPlainObject(t))for(r in t)m(this[r])?this[r](t[r]):this.attr(r,t[r]);return this}return(i=E.getElementById(r[2]))&&(this[0]=i,this.length=1),this}return e.nodeType?(this[0]=e,this.length=1,this):m(e)?void 0!==n.ready?n.ready(e):e(k):k.makeArray(e,this)}).prototype=k.fn,q=k(E);var H=/^(?:parents|prev(?:Until|All))/,O={children:!0,contents:!0,next:!0,prev:!0};function P(e,t){while((e=e[t])&&1!==e.nodeType);return e}k.fn.extend({has:function(e){var t=k(e,this),n=t.length;return this.filter(function(){for(var e=0;e<n;e++)if(k.contains(this,t[e]))return!0})},closest:function(e,t){var n,r=0,i=this.length,o=[],a="string"!=typeof e&&k(e);if(!N.test(e))for(;r<i;r++)for(n=this[r];n&&n!==t;n=n.parentNode)if(n.nodeType<11&&(a?-1<a.index(n):1===n.nodeType&&k.find.matchesSelector(n,e))){o.push(n);break}return this.pushStack(1<o.length?k.uniqueSort(o):o)},index:function(e){return e?"string"==typeof e?i.call(k(e),this[0]):i.call(this,e.jquery?e[0]:e):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){return this.pushStack(k.uniqueSort(k.merge(this.get(),k(e,t))))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}}),k.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return T(e,"parentNode")},parentsUntil:function(e,t,n){return T(e,"parentNode",n)},next:function(e){return P(e,"nextSibling")},prev:function(e){return P(e,"previousSibling")},nextAll:function(e){return T(e,"nextSibling")},prevAll:function(e){return T(e,"previousSibling")},nextUntil:function(e,t,n){return T(e,"nextSibling",n)},prevUntil:function(e,t,n){return T(e,"previousSibling",n)},siblings:function(e){return S((e.parentNode||{}).firstChild,e)},children:function(e){return S(e.firstChild)},contents:function(e){return"undefined"!=typeof e.contentDocument?e.contentDocument:(A(e,"template")&&(e=e.content||e),k.merge([],e.childNodes))}},function(r,i){k.fn[r]=function(e,t){var n=k.map(this,i,e);return"Until"!==r.slice(-5)&&(t=e),t&&"string"==typeof t&&(n=k.filter(t,n)),1<this.length&&(O[r]||k.uniqueSort(n),H.test(r)&&n.reverse()),this.pushStack(n)}});var R=/[^\x20\t\r\n\f]+/g;function M(e){return e}function I(e){throw e}function W(e,t,n,r){var i;try{e&&m(i=e.promise)?i.call(e).done(t).fail(n):e&&m(i=e.then)?i.call(e,t,n):t.apply(void 0,[e].slice(r))}catch(e){n.apply(void 0,[e])}}k.Callbacks=function(r){var e,n;r="string"==typeof r?(e=r,n={},k.each(e.match(R)||[],function(e,t){n[t]=!0}),n):k.extend({},r);var i,t,o,a,s=[],u=[],l=-1,c=function(){for(a=a||r.once,o=i=!0;u.length;l=-1){t=u.shift();while(++l<s.length)!1===s[l].apply(t[0],t[1])&&r.stopOnFalse&&(l=s.length,t=!1)}r.memory||(t=!1),i=!1,a&&(s=t?[]:"")},f={add:function(){return s&&(t&&!i&&(l=s.length-1,u.push(t)),function n(e){k.each(e,function(e,t){m(t)?r.unique&&f.has(t)||s.push(t):t&&t.length&&"string"!==w(t)&&n(t)})}(arguments),t&&!i&&c()),this},remove:function(){return k.each(arguments,function(e,t){var n;while(-1<(n=k.inArray(t,s,n)))s.splice(n,1),n<=l&&l--}),this},has:function(e){return e?-1<k.inArray(e,s):0<s.length},empty:function(){return s&&(s=[]),this},disable:function(){return a=u=[],s=t="",this},disabled:function(){return!s},lock:function(){return a=u=[],t||i||(s=t=""),this},locked:function(){return!!a},fireWith:function(e,t){return a||(t=[e,(t=t||[]).slice?t.slice():t],u.push(t),i||c()),this},fire:function(){return f.fireWith(this,arguments),this},fired:function(){return!!o}};return f},k.extend({Deferred:function(e){var o=[["notify","progress",k.Callbacks("memory"),k.Callbacks("memory"),2],["resolve","done",k.Callbacks("once memory"),k.Callbacks("once memory"),0,"resolved"],["reject","fail",k.Callbacks("once memory"),k.Callbacks("once memory"),1,"rejected"]],i="pending",a={state:function(){return i},always:function(){return s.done(arguments).fail(arguments),this},"catch":function(e){return a.then(null,e)},pipe:function(){var i=arguments;return k.Deferred(function(r){k.each(o,function(e,t){var n=m(i[t[4]])&&i[t[4]];s[t[1]](function(){var e=n&&n.apply(this,arguments);e&&m(e.promise)?e.promise().progress(r.notify).done(r.resolve).fail(r.reject):r[t[0]+"With"](this,n?[e]:arguments)})}),i=null}).promise()},then:function(t,n,r){var u=0;function l(i,o,a,s){return function(){var n=this,r=arguments,e=function(){var e,t;if(!(i<u)){if((e=a.apply(n,r))===o.promise())throw new TypeError("Thenable self-resolution");t=e&&("object"==typeof e||"function"==typeof e)&&e.then,m(t)?s?t.call(e,l(u,o,M,s),l(u,o,I,s)):(u++,t.call(e,l(u,o,M,s),l(u,o,I,s),l(u,o,M,o.notifyWith))):(a!==M&&(n=void 0,r=[e]),(s||o.resolveWith)(n,r))}},t=s?e:function(){try{e()}catch(e){k.Deferred.exceptionHook&&k.Deferred.exceptionHook(e,t.stackTrace),u<=i+1&&(a!==I&&(n=void 0,r=[e]),o.rejectWith(n,r))}};i?t():(k.Deferred.getStackHook&&(t.stackTrace=k.Deferred.getStackHook()),C.setTimeout(t))}}return k.Deferred(function(e){o[0][3].add(l(0,e,m(r)?r:M,e.notifyWith)),o[1][3].add(l(0,e,m(t)?t:M)),o[2][3].add(l(0,e,m(n)?n:I))}).promise()},promise:function(e){return null!=e?k.extend(e,a):a}},s={};return k.each(o,function(e,t){var n=t[2],r=t[5];a[t[1]]=n.add,r&&n.add(function(){i=r},o[3-e][2].disable,o[3-e][3].disable,o[0][2].lock,o[0][3].lock),n.add(t[3].fire),s[t[0]]=function(){return s[t[0]+"With"](this===s?void 0:this,arguments),this},s[t[0]+"With"]=n.fireWith}),a.promise(s),e&&e.call(s,s),s},when:function(e){var n=arguments.length,t=n,r=Array(t),i=s.call(arguments),o=k.Deferred(),a=function(t){return function(e){r[t]=this,i[t]=1<arguments.length?s.call(arguments):e,--n||o.resolveWith(r,i)}};if(n<=1&&(W(e,o.done(a(t)).resolve,o.reject,!n),"pending"===o.state()||m(i[t]&&i[t].then)))return o.then();while(t--)W(i[t],a(t),o.reject);return o.promise()}});var $=/^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;k.Deferred.exceptionHook=function(e,t){C.console&&C.console.warn&&e&&$.test(e.name)&&C.console.warn("jQuery.Deferred exception: "+e.message,e.stack,t)},k.readyException=function(e){C.setTimeout(function(){throw e})};var F=k.Deferred();function B(){E.removeEventListener("DOMContentLoaded",B),C.removeEventListener("load",B),k.ready()}k.fn.ready=function(e){return F.then(e)["catch"](function(e){k.readyException(e)}),this},k.extend({isReady:!1,readyWait:1,ready:function(e){(!0===e?--k.readyWait:k.isReady)||(k.isReady=!0)!==e&&0<--k.readyWait||F.resolveWith(E,[k])}}),k.ready.then=F.then,"complete"===E.readyState||"loading"!==E.readyState&&!E.documentElement.doScroll?C.setTimeout(k.ready):(E.addEventListener("DOMContentLoaded",B),C.addEventListener("load",B));var _=function(e,t,n,r,i,o,a){var s=0,u=e.length,l=null==n;if("object"===w(n))for(s in i=!0,n)_(e,t,s,n[s],!0,o,a);else if(void 0!==r&&(i=!0,m(r)||(a=!0),l&&(a?(t.call(e,r),t=null):(l=t,t=function(e,t,n){return l.call(k(e),n)})),t))for(;s<u;s++)t(e[s],n,a?r:r.call(e[s],s,t(e[s],n)));return i?e:l?t.call(e):u?t(e[0],n):o},z=/^-ms-/,U=/-([a-z])/g;function X(e,t){return t.toUpperCase()}function V(e){return e.replace(z,"ms-").replace(U,X)}var G=function(e){return 1===e.nodeType||9===e.nodeType||!+e.nodeType};function Y(){this.expando=k.expando+Y.uid++}Y.uid=1,Y.prototype={cache:function(e){var t=e[this.expando];return t||(t={},G(e)&&(e.nodeType?e[this.expando]=t:Object.defineProperty(e,this.expando,{value:t,configurable:!0}))),t},set:function(e,t,n){var r,i=this.cache(e);if("string"==typeof t)i[V(t)]=n;else for(r in t)i[V(r)]=t[r];return i},get:function(e,t){return void 0===t?this.cache(e):e[this.expando]&&e[this.expando][V(t)]},access:function(e,t,n){return void 0===t||t&&"string"==typeof t&&void 0===n?this.get(e,t):(this.set(e,t,n),void 0!==n?n:t)},remove:function(e,t){var n,r=e[this.expando];if(void 0!==r){if(void 0!==t){n=(t=Array.isArray(t)?t.map(V):(t=V(t))in r?[t]:t.match(R)||[]).length;while(n--)delete r[t[n]]}(void 0===t||k.isEmptyObject(r))&&(e.nodeType?e[this.expando]=void 0:delete e[this.expando])}},hasData:function(e){var t=e[this.expando];return void 0!==t&&!k.isEmptyObject(t)}};var Q=new Y,J=new Y,K=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,Z=/[A-Z]/g;function ee(e,t,n){var r,i;if(void 0===n&&1===e.nodeType)if(r="data-"+t.replace(Z,"-$&").toLowerCase(),"string"==typeof(n=e.getAttribute(r))){try{n="true"===(i=n)||"false"!==i&&("null"===i?null:i===+i+""?+i:K.test(i)?JSON.parse(i):i)}catch(e){}J.set(e,t,n)}else n=void 0;return n}k.extend({hasData:function(e){return J.hasData(e)||Q.hasData(e)},data:function(e,t,n){return J.access(e,t,n)},removeData:function(e,t){J.remove(e,t)},_data:function(e,t,n){return Q.access(e,t,n)},_removeData:function(e,t){Q.remove(e,t)}}),k.fn.extend({data:function(n,e){var t,r,i,o=this[0],a=o&&o.attributes;if(void 0===n){if(this.length&&(i=J.get(o),1===o.nodeType&&!Q.get(o,"hasDataAttrs"))){t=a.length;while(t--)a[t]&&0===(r=a[t].name).indexOf("data-")&&(r=V(r.slice(5)),ee(o,r,i[r]));Q.set(o,"hasDataAttrs",!0)}return i}return"object"==typeof n?this.each(function(){J.set(this,n)}):_(this,function(e){var t;if(o&&void 0===e)return void 0!==(t=J.get(o,n))?t:void 0!==(t=ee(o,n))?t:void 0;this.each(function(){J.set(this,n,e)})},null,e,1<arguments.length,null,!0)},removeData:function(e){return this.each(function(){J.remove(this,e)})}}),k.extend({queue:function(e,t,n){var r;if(e)return t=(t||"fx")+"queue",r=Q.get(e,t),n&&(!r||Array.isArray(n)?r=Q.access(e,t,k.makeArray(n)):r.push(n)),r||[]},dequeue:function(e,t){t=t||"fx";var n=k.queue(e,t),r=n.length,i=n.shift(),o=k._queueHooks(e,t);"inprogress"===i&&(i=n.shift(),r--),i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,function(){k.dequeue(e,t)},o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return Q.get(e,n)||Q.access(e,n,{empty:k.Callbacks("once memory").add(function(){Q.remove(e,[t+"queue",n])})})}}),k.fn.extend({queue:function(t,n){var e=2;return"string"!=typeof t&&(n=t,t="fx",e--),arguments.length<e?k.queue(this[0],t):void 0===n?this:this.each(function(){var e=k.queue(this,t,n);k._queueHooks(this,t),"fx"===t&&"inprogress"!==e[0]&&k.dequeue(this,t)})},dequeue:function(e){return this.each(function(){k.dequeue(this,e)})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,t){var n,r=1,i=k.Deferred(),o=this,a=this.length,s=function(){--r||i.resolveWith(o,[o])};"string"!=typeof e&&(t=e,e=void 0),e=e||"fx";while(a--)(n=Q.get(o[a],e+"queueHooks"))&&n.empty&&(r++,n.empty.add(s));return s(),i.promise(t)}});var te=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,ne=new RegExp("^(?:([+-])=|)("+te+")([a-z%]*)$","i"),re=["Top","Right","Bottom","Left"],ie=E.documentElement,oe=function(e){return k.contains(e.ownerDocument,e)},ae={composed:!0};ie.getRootNode&&(oe=function(e){return k.contains(e.ownerDocument,e)||e.getRootNode(ae)===e.ownerDocument});var se=function(e,t){return"none"===(e=t||e).style.display||""===e.style.display&&oe(e)&&"none"===k.css(e,"display")},ue=function(e,t,n,r){var i,o,a={};for(o in t)a[o]=e.style[o],e.style[o]=t[o];for(o in i=n.apply(e,r||[]),t)e.style[o]=a[o];return i};function le(e,t,n,r){var i,o,a=20,s=r?function(){return r.cur()}:function(){return k.css(e,t,"")},u=s(),l=n&&n[3]||(k.cssNumber[t]?"":"px"),c=e.nodeType&&(k.cssNumber[t]||"px"!==l&&+u)&&ne.exec(k.css(e,t));if(c&&c[3]!==l){u/=2,l=l||c[3],c=+u||1;while(a--)k.style(e,t,c+l),(1-o)*(1-(o=s()/u||.5))<=0&&(a=0),c/=o;c*=2,k.style(e,t,c+l),n=n||[]}return n&&(c=+c||+u||0,i=n[1]?c+(n[1]+1)*n[2]:+n[2],r&&(r.unit=l,r.start=c,r.end=i)),i}var ce={};function fe(e,t){for(var n,r,i,o,a,s,u,l=[],c=0,f=e.length;c<f;c++)(r=e[c]).style&&(n=r.style.display,t?("none"===n&&(l[c]=Q.get(r,"display")||null,l[c]||(r.style.display="")),""===r.style.display&&se(r)&&(l[c]=(u=a=o=void 0,a=(i=r).ownerDocument,s=i.nodeName,(u=ce[s])||(o=a.body.appendChild(a.createElement(s)),u=k.css(o,"display"),o.parentNode.removeChild(o),"none"===u&&(u="block"),ce[s]=u)))):"none"!==n&&(l[c]="none",Q.set(r,"display",n)));for(c=0;c<f;c++)null!=l[c]&&(e[c].style.display=l[c]);return e}k.fn.extend({show:function(){return fe(this,!0)},hide:function(){return fe(this)},toggle:function(e){return"boolean"==typeof e?e?this.show():this.hide():this.each(function(){se(this)?k(this).show():k(this).hide()})}});var pe=/^(?:checkbox|radio)$/i,de=/<([a-z][^\/\0>\x20\t\r\n\f]*)/i,he=/^$|^module$|\/(?:java|ecma)script/i,ge={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};function ve(e,t){var n;return n="undefined"!=typeof e.getElementsByTagName?e.getElementsByTagName(t||"*"):"undefined"!=typeof e.querySelectorAll?e.querySelectorAll(t||"*"):[],void 0===t||t&&A(e,t)?k.merge([e],n):n}function ye(e,t){for(var n=0,r=e.length;n<r;n++)Q.set(e[n],"globalEval",!t||Q.get(t[n],"globalEval"))}ge.optgroup=ge.option,ge.tbody=ge.tfoot=ge.colgroup=ge.caption=ge.thead,ge.th=ge.td;var me,xe,be=/<|&#?\w+;/;function we(e,t,n,r,i){for(var o,a,s,u,l,c,f=t.createDocumentFragment(),p=[],d=0,h=e.length;d<h;d++)if((o=e[d])||0===o)if("object"===w(o))k.merge(p,o.nodeType?[o]:o);else if(be.test(o)){a=a||f.appendChild(t.createElement("div")),s=(de.exec(o)||["",""])[1].toLowerCase(),u=ge[s]||ge._default,a.innerHTML=u[1]+k.htmlPrefilter(o)+u[2],c=u[0];while(c--)a=a.lastChild;k.merge(p,a.childNodes),(a=f.firstChild).textContent=""}else p.push(t.createTextNode(o));f.textContent="",d=0;while(o=p[d++])if(r&&-1<k.inArray(o,r))i&&i.push(o);else if(l=oe(o),a=ve(f.appendChild(o),"script"),l&&ye(a),n){c=0;while(o=a[c++])he.test(o.type||"")&&n.push(o)}return f}me=E.createDocumentFragment().appendChild(E.createElement("div")),(xe=E.createElement("input")).setAttribute("type","radio"),xe.setAttribute("checked","checked"),xe.setAttribute("name","t"),me.appendChild(xe),y.checkClone=me.cloneNode(!0).cloneNode(!0).lastChild.checked,me.innerHTML="<textarea>x</textarea>",y.noCloneChecked=!!me.cloneNode(!0).lastChild.defaultValue;var Te=/^key/,Ce=/^(?:mouse|pointer|contextmenu|drag|drop)|click/,Ee=/^([^.]*)(?:\.(.+)|)/;function ke(){return!0}function Se(){return!1}function Ne(e,t){return e===function(){try{return E.activeElement}catch(e){}}()==("focus"===t)}function Ae(e,t,n,r,i,o){var a,s;if("object"==typeof t){for(s in"string"!=typeof n&&(r=r||n,n=void 0),t)Ae(e,s,n,r,t[s],o);return e}if(null==r&&null==i?(i=n,r=n=void 0):null==i&&("string"==typeof n?(i=r,r=void 0):(i=r,r=n,n=void 0)),!1===i)i=Se;else if(!i)return e;return 1===o&&(a=i,(i=function(e){return k().off(e),a.apply(this,arguments)}).guid=a.guid||(a.guid=k.guid++)),e.each(function(){k.event.add(this,t,i,r,n)})}function De(e,i,o){o?(Q.set(e,i,!1),k.event.add(e,i,{namespace:!1,handler:function(e){var t,n,r=Q.get(this,i);if(1&e.isTrigger&&this[i]){if(r.length)(k.event.special[i]||{}).delegateType&&e.stopPropagation();else if(r=s.call(arguments),Q.set(this,i,r),t=o(this,i),this[i](),r!==(n=Q.get(this,i))||t?Q.set(this,i,!1):n={},r!==n)return e.stopImmediatePropagation(),e.preventDefault(),n.value}else r.length&&(Q.set(this,i,{value:k.event.trigger(k.extend(r[0],k.Event.prototype),r.slice(1),this)}),e.stopImmediatePropagation())}})):void 0===Q.get(e,i)&&k.event.add(e,i,ke)}k.event={global:{},add:function(t,e,n,r,i){var o,a,s,u,l,c,f,p,d,h,g,v=Q.get(t);if(v){n.handler&&(n=(o=n).handler,i=o.selector),i&&k.find.matchesSelector(ie,i),n.guid||(n.guid=k.guid++),(u=v.events)||(u=v.events={}),(a=v.handle)||(a=v.handle=function(e){return"undefined"!=typeof k&&k.event.triggered!==e.type?k.event.dispatch.apply(t,arguments):void 0}),l=(e=(e||"").match(R)||[""]).length;while(l--)d=g=(s=Ee.exec(e[l])||[])[1],h=(s[2]||"").split(".").sort(),d&&(f=k.event.special[d]||{},d=(i?f.delegateType:f.bindType)||d,f=k.event.special[d]||{},c=k.extend({type:d,origType:g,data:r,handler:n,guid:n.guid,selector:i,needsContext:i&&k.expr.match.needsContext.test(i),namespace:h.join(".")},o),(p=u[d])||((p=u[d]=[]).delegateCount=0,f.setup&&!1!==f.setup.call(t,r,h,a)||t.addEventListener&&t.addEventListener(d,a)),f.add&&(f.add.call(t,c),c.handler.guid||(c.handler.guid=n.guid)),i?p.splice(p.delegateCount++,0,c):p.push(c),k.event.global[d]=!0)}},remove:function(e,t,n,r,i){var o,a,s,u,l,c,f,p,d,h,g,v=Q.hasData(e)&&Q.get(e);if(v&&(u=v.events)){l=(t=(t||"").match(R)||[""]).length;while(l--)if(d=g=(s=Ee.exec(t[l])||[])[1],h=(s[2]||"").split(".").sort(),d){f=k.event.special[d]||{},p=u[d=(r?f.delegateType:f.bindType)||d]||[],s=s[2]&&new RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"),a=o=p.length;while(o--)c=p[o],!i&&g!==c.origType||n&&n.guid!==c.guid||s&&!s.test(c.namespace)||r&&r!==c.selector&&("**"!==r||!c.selector)||(p.splice(o,1),c.selector&&p.delegateCount--,f.remove&&f.remove.call(e,c));a&&!p.length&&(f.teardown&&!1!==f.teardown.call(e,h,v.handle)||k.removeEvent(e,d,v.handle),delete u[d])}else for(d in u)k.event.remove(e,d+t[l],n,r,!0);k.isEmptyObject(u)&&Q.remove(e,"handle events")}},dispatch:function(e){var t,n,r,i,o,a,s=k.event.fix(e),u=new Array(arguments.length),l=(Q.get(this,"events")||{})[s.type]||[],c=k.event.special[s.type]||{};for(u[0]=s,t=1;t<arguments.length;t++)u[t]=arguments[t];if(s.delegateTarget=this,!c.preDispatch||!1!==c.preDispatch.call(this,s)){a=k.event.handlers.call(this,s,l),t=0;while((i=a[t++])&&!s.isPropagationStopped()){s.currentTarget=i.elem,n=0;while((o=i.handlers[n++])&&!s.isImmediatePropagationStopped())s.rnamespace&&!1!==o.namespace&&!s.rnamespace.test(o.namespace)||(s.handleObj=o,s.data=o.data,void 0!==(r=((k.event.special[o.origType]||{}).handle||o.handler).apply(i.elem,u))&&!1===(s.result=r)&&(s.preventDefault(),s.stopPropagation()))}return c.postDispatch&&c.postDispatch.call(this,s),s.result}},handlers:function(e,t){var n,r,i,o,a,s=[],u=t.delegateCount,l=e.target;if(u&&l.nodeType&&!("click"===e.type&&1<=e.button))for(;l!==this;l=l.parentNode||this)if(1===l.nodeType&&("click"!==e.type||!0!==l.disabled)){for(o=[],a={},n=0;n<u;n++)void 0===a[i=(r=t[n]).selector+" "]&&(a[i]=r.needsContext?-1<k(i,this).index(l):k.find(i,this,null,[l]).length),a[i]&&o.push(r);o.length&&s.push({elem:l,handlers:o})}return l=this,u<t.length&&s.push({elem:l,handlers:t.slice(u)}),s},addProp:function(t,e){Object.defineProperty(k.Event.prototype,t,{enumerable:!0,configurable:!0,get:m(e)?function(){if(this.originalEvent)return e(this.originalEvent)}:function(){if(this.originalEvent)return this.originalEvent[t]},set:function(e){Object.defineProperty(this,t,{enumerable:!0,configurable:!0,writable:!0,value:e})}})},fix:function(e){return e[k.expando]?e:new k.Event(e)},special:{load:{noBubble:!0},click:{setup:function(e){var t=this||e;return pe.test(t.type)&&t.click&&A(t,"input")&&De(t,"click",ke),!1},trigger:function(e){var t=this||e;return pe.test(t.type)&&t.click&&A(t,"input")&&De(t,"click"),!0},_default:function(e){var t=e.target;return pe.test(t.type)&&t.click&&A(t,"input")&&Q.get(t,"click")||A(t,"a")}},beforeunload:{postDispatch:function(e){void 0!==e.result&&e.originalEvent&&(e.originalEvent.returnValue=e.result)}}}},k.removeEvent=function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n)},k.Event=function(e,t){if(!(this instanceof k.Event))return new k.Event(e,t);e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||void 0===e.defaultPrevented&&!1===e.returnValue?ke:Se,this.target=e.target&&3===e.target.nodeType?e.target.parentNode:e.target,this.currentTarget=e.currentTarget,this.relatedTarget=e.relatedTarget):this.type=e,t&&k.extend(this,t),this.timeStamp=e&&e.timeStamp||Date.now(),this[k.expando]=!0},k.Event.prototype={constructor:k.Event,isDefaultPrevented:Se,isPropagationStopped:Se,isImmediatePropagationStopped:Se,isSimulated:!1,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=ke,e&&!this.isSimulated&&e.preventDefault()},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=ke,e&&!this.isSimulated&&e.stopPropagation()},stopImmediatePropagation:function(){var e=this.originalEvent;this.isImmediatePropagationStopped=ke,e&&!this.isSimulated&&e.stopImmediatePropagation(),this.stopPropagation()}},k.each({altKey:!0,bubbles:!0,cancelable:!0,changedTouches:!0,ctrlKey:!0,detail:!0,eventPhase:!0,metaKey:!0,pageX:!0,pageY:!0,shiftKey:!0,view:!0,"char":!0,code:!0,charCode:!0,key:!0,keyCode:!0,button:!0,buttons:!0,clientX:!0,clientY:!0,offsetX:!0,offsetY:!0,pointerId:!0,pointerType:!0,screenX:!0,screenY:!0,targetTouches:!0,toElement:!0,touches:!0,which:function(e){var t=e.button;return null==e.which&&Te.test(e.type)?null!=e.charCode?e.charCode:e.keyCode:!e.which&&void 0!==t&&Ce.test(e.type)?1&t?1:2&t?3:4&t?2:0:e.which}},k.event.addProp),k.each({focus:"focusin",blur:"focusout"},function(e,t){k.event.special[e]={setup:function(){return De(this,e,Ne),!1},trigger:function(){return De(this,e),!0},delegateType:t}}),k.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(e,i){k.event.special[e]={delegateType:i,bindType:i,handle:function(e){var t,n=e.relatedTarget,r=e.handleObj;return n&&(n===this||k.contains(this,n))||(e.type=r.origType,t=r.handler.apply(this,arguments),e.type=i),t}}}),k.fn.extend({on:function(e,t,n,r){return Ae(this,e,t,n,r)},one:function(e,t,n,r){return Ae(this,e,t,n,r,1)},off:function(e,t,n){var r,i;if(e&&e.preventDefault&&e.handleObj)return r=e.handleObj,k(e.delegateTarget).off(r.namespace?r.origType+"."+r.namespace:r.origType,r.selector,r.handler),this;if("object"==typeof e){for(i in e)this.off(i,t,e[i]);return this}return!1!==t&&"function"!=typeof t||(n=t,t=void 0),!1===n&&(n=Se),this.each(function(){k.event.remove(this,e,n,t)})}});var je=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,qe=/<script|<style|<link/i,Le=/checked\s*(?:[^=]|=\s*.checked.)/i,He=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;function Oe(e,t){return A(e,"table")&&A(11!==t.nodeType?t:t.firstChild,"tr")&&k(e).children("tbody")[0]||e}function Pe(e){return e.type=(null!==e.getAttribute("type"))+"/"+e.type,e}function Re(e){return"true/"===(e.type||"").slice(0,5)?e.type=e.type.slice(5):e.removeAttribute("type"),e}function Me(e,t){var n,r,i,o,a,s,u,l;if(1===t.nodeType){if(Q.hasData(e)&&(o=Q.access(e),a=Q.set(t,o),l=o.events))for(i in delete a.handle,a.events={},l)for(n=0,r=l[i].length;n<r;n++)k.event.add(t,i,l[i][n]);J.hasData(e)&&(s=J.access(e),u=k.extend({},s),J.set(t,u))}}function Ie(n,r,i,o){r=g.apply([],r);var e,t,a,s,u,l,c=0,f=n.length,p=f-1,d=r[0],h=m(d);if(h||1<f&&"string"==typeof d&&!y.checkClone&&Le.test(d))return n.each(function(e){var t=n.eq(e);h&&(r[0]=d.call(this,e,t.html())),Ie(t,r,i,o)});if(f&&(t=(e=we(r,n[0].ownerDocument,!1,n,o)).firstChild,1===e.childNodes.length&&(e=t),t||o)){for(s=(a=k.map(ve(e,"script"),Pe)).length;c<f;c++)u=e,c!==p&&(u=k.clone(u,!0,!0),s&&k.merge(a,ve(u,"script"))),i.call(n[c],u,c);if(s)for(l=a[a.length-1].ownerDocument,k.map(a,Re),c=0;c<s;c++)u=a[c],he.test(u.type||"")&&!Q.access(u,"globalEval")&&k.contains(l,u)&&(u.src&&"module"!==(u.type||"").toLowerCase()?k._evalUrl&&!u.noModule&&k._evalUrl(u.src,{nonce:u.nonce||u.getAttribute("nonce")}):b(u.textContent.replace(He,""),u,l))}return n}function We(e,t,n){for(var r,i=t?k.filter(t,e):e,o=0;null!=(r=i[o]);o++)n||1!==r.nodeType||k.cleanData(ve(r)),r.parentNode&&(n&&oe(r)&&ye(ve(r,"script")),r.parentNode.removeChild(r));return e}k.extend({htmlPrefilter:function(e){return e.replace(je,"<$1></$2>")},clone:function(e,t,n){var r,i,o,a,s,u,l,c=e.cloneNode(!0),f=oe(e);if(!(y.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||k.isXMLDoc(e)))for(a=ve(c),r=0,i=(o=ve(e)).length;r<i;r++)s=o[r],u=a[r],void 0,"input"===(l=u.nodeName.toLowerCase())&&pe.test(s.type)?u.checked=s.checked:"input"!==l&&"textarea"!==l||(u.defaultValue=s.defaultValue);if(t)if(n)for(o=o||ve(e),a=a||ve(c),r=0,i=o.length;r<i;r++)Me(o[r],a[r]);else Me(e,c);return 0<(a=ve(c,"script")).length&&ye(a,!f&&ve(e,"script")),c},cleanData:function(e){for(var t,n,r,i=k.event.special,o=0;void 0!==(n=e[o]);o++)if(G(n)){if(t=n[Q.expando]){if(t.events)for(r in t.events)i[r]?k.event.remove(n,r):k.removeEvent(n,r,t.handle);n[Q.expando]=void 0}n[J.expando]&&(n[J.expando]=void 0)}}}),k.fn.extend({detach:function(e){return We(this,e,!0)},remove:function(e){return We(this,e)},text:function(e){return _(this,function(e){return void 0===e?k.text(this):this.empty().each(function(){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||(this.textContent=e)})},null,e,arguments.length)},append:function(){return Ie(this,arguments,function(e){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||Oe(this,e).appendChild(e)})},prepend:function(){return Ie(this,arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=Oe(this,e);t.insertBefore(e,t.firstChild)}})},before:function(){return Ie(this,arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return Ie(this,arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},empty:function(){for(var e,t=0;null!=(e=this[t]);t++)1===e.nodeType&&(k.cleanData(ve(e,!1)),e.textContent="");return this},clone:function(e,t){return e=null!=e&&e,t=null==t?e:t,this.map(function(){return k.clone(this,e,t)})},html:function(e){return _(this,function(e){var t=this[0]||{},n=0,r=this.length;if(void 0===e&&1===t.nodeType)return t.innerHTML;if("string"==typeof e&&!qe.test(e)&&!ge[(de.exec(e)||["",""])[1].toLowerCase()]){e=k.htmlPrefilter(e);try{for(;n<r;n++)1===(t=this[n]||{}).nodeType&&(k.cleanData(ve(t,!1)),t.innerHTML=e);t=0}catch(e){}}t&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(){var n=[];return Ie(this,arguments,function(e){var t=this.parentNode;k.inArray(this,n)<0&&(k.cleanData(ve(this)),t&&t.replaceChild(e,this))},n)}}),k.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,a){k.fn[e]=function(e){for(var t,n=[],r=k(e),i=r.length-1,o=0;o<=i;o++)t=o===i?this:this.clone(!0),k(r[o])[a](t),u.apply(n,t.get());return this.pushStack(n)}});var $e=new RegExp("^("+te+")(?!px)[a-z%]+$","i"),Fe=function(e){var t=e.ownerDocument.defaultView;return t&&t.opener||(t=C),t.getComputedStyle(e)},Be=new RegExp(re.join("|"),"i");function _e(e,t,n){var r,i,o,a,s=e.style;return(n=n||Fe(e))&&(""!==(a=n.getPropertyValue(t)||n[t])||oe(e)||(a=k.style(e,t)),!y.pixelBoxStyles()&&$e.test(a)&&Be.test(t)&&(r=s.width,i=s.minWidth,o=s.maxWidth,s.minWidth=s.maxWidth=s.width=a,a=n.width,s.width=r,s.minWidth=i,s.maxWidth=o)),void 0!==a?a+"":a}function ze(e,t){return{get:function(){if(!e())return(this.get=t).apply(this,arguments);delete this.get}}}!function(){function e(){if(u){s.style.cssText="position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0",u.style.cssText="position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%",ie.appendChild(s).appendChild(u);var e=C.getComputedStyle(u);n="1%"!==e.top,a=12===t(e.marginLeft),u.style.right="60%",o=36===t(e.right),r=36===t(e.width),u.style.position="absolute",i=12===t(u.offsetWidth/3),ie.removeChild(s),u=null}}function t(e){return Math.round(parseFloat(e))}var n,r,i,o,a,s=E.createElement("div"),u=E.createElement("div");u.style&&(u.style.backgroundClip="content-box",u.cloneNode(!0).style.backgroundClip="",y.clearCloneStyle="content-box"===u.style.backgroundClip,k.extend(y,{boxSizingReliable:function(){return e(),r},pixelBoxStyles:function(){return e(),o},pixelPosition:function(){return e(),n},reliableMarginLeft:function(){return e(),a},scrollboxSize:function(){return e(),i}}))}();var Ue=["Webkit","Moz","ms"],Xe=E.createElement("div").style,Ve={};function Ge(e){var t=k.cssProps[e]||Ve[e];return t||(e in Xe?e:Ve[e]=function(e){var t=e[0].toUpperCase()+e.slice(1),n=Ue.length;while(n--)if((e=Ue[n]+t)in Xe)return e}(e)||e)}var Ye=/^(none|table(?!-c[ea]).+)/,Qe=/^--/,Je={position:"absolute",visibility:"hidden",display:"block"},Ke={letterSpacing:"0",fontWeight:"400"};function Ze(e,t,n){var r=ne.exec(t);return r?Math.max(0,r[2]-(n||0))+(r[3]||"px"):t}function et(e,t,n,r,i,o){var a="width"===t?1:0,s=0,u=0;if(n===(r?"border":"content"))return 0;for(;a<4;a+=2)"margin"===n&&(u+=k.css(e,n+re[a],!0,i)),r?("content"===n&&(u-=k.css(e,"padding"+re[a],!0,i)),"margin"!==n&&(u-=k.css(e,"border"+re[a]+"Width",!0,i))):(u+=k.css(e,"padding"+re[a],!0,i),"padding"!==n?u+=k.css(e,"border"+re[a]+"Width",!0,i):s+=k.css(e,"border"+re[a]+"Width",!0,i));return!r&&0<=o&&(u+=Math.max(0,Math.ceil(e["offset"+t[0].toUpperCase()+t.slice(1)]-o-u-s-.5))||0),u}function tt(e,t,n){var r=Fe(e),i=(!y.boxSizingReliable()||n)&&"border-box"===k.css(e,"boxSizing",!1,r),o=i,a=_e(e,t,r),s="offset"+t[0].toUpperCase()+t.slice(1);if($e.test(a)){if(!n)return a;a="auto"}return(!y.boxSizingReliable()&&i||"auto"===a||!parseFloat(a)&&"inline"===k.css(e,"display",!1,r))&&e.getClientRects().length&&(i="border-box"===k.css(e,"boxSizing",!1,r),(o=s in e)&&(a=e[s])),(a=parseFloat(a)||0)+et(e,t,n||(i?"border":"content"),o,r,a)+"px"}function nt(e,t,n,r,i){return new nt.prototype.init(e,t,n,r,i)}k.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=_e(e,"opacity");return""===n?"1":n}}}},cssNumber:{animationIterationCount:!0,columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,gridArea:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnStart:!0,gridRow:!0,gridRowEnd:!0,gridRowStart:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{},style:function(e,t,n,r){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var i,o,a,s=V(t),u=Qe.test(t),l=e.style;if(u||(t=Ge(s)),a=k.cssHooks[t]||k.cssHooks[s],void 0===n)return a&&"get"in a&&void 0!==(i=a.get(e,!1,r))?i:l[t];"string"===(o=typeof n)&&(i=ne.exec(n))&&i[1]&&(n=le(e,t,i),o="number"),null!=n&&n==n&&("number"!==o||u||(n+=i&&i[3]||(k.cssNumber[s]?"":"px")),y.clearCloneStyle||""!==n||0!==t.indexOf("background")||(l[t]="inherit"),a&&"set"in a&&void 0===(n=a.set(e,n,r))||(u?l.setProperty(t,n):l[t]=n))}},css:function(e,t,n,r){var i,o,a,s=V(t);return Qe.test(t)||(t=Ge(s)),(a=k.cssHooks[t]||k.cssHooks[s])&&"get"in a&&(i=a.get(e,!0,n)),void 0===i&&(i=_e(e,t,r)),"normal"===i&&t in Ke&&(i=Ke[t]),""===n||n?(o=parseFloat(i),!0===n||isFinite(o)?o||0:i):i}}),k.each(["height","width"],function(e,u){k.cssHooks[u]={get:function(e,t,n){if(t)return!Ye.test(k.css(e,"display"))||e.getClientRects().length&&e.getBoundingClientRect().width?tt(e,u,n):ue(e,Je,function(){return tt(e,u,n)})},set:function(e,t,n){var r,i=Fe(e),o=!y.scrollboxSize()&&"absolute"===i.position,a=(o||n)&&"border-box"===k.css(e,"boxSizing",!1,i),s=n?et(e,u,n,a,i):0;return a&&o&&(s-=Math.ceil(e["offset"+u[0].toUpperCase()+u.slice(1)]-parseFloat(i[u])-et(e,u,"border",!1,i)-.5)),s&&(r=ne.exec(t))&&"px"!==(r[3]||"px")&&(e.style[u]=t,t=k.css(e,u)),Ze(0,t,s)}}}),k.cssHooks.marginLeft=ze(y.reliableMarginLeft,function(e,t){if(t)return(parseFloat(_e(e,"marginLeft"))||e.getBoundingClientRect().left-ue(e,{marginLeft:0},function(){return e.getBoundingClientRect().left}))+"px"}),k.each({margin:"",padding:"",border:"Width"},function(i,o){k.cssHooks[i+o]={expand:function(e){for(var t=0,n={},r="string"==typeof e?e.split(" "):[e];t<4;t++)n[i+re[t]+o]=r[t]||r[t-2]||r[0];return n}},"margin"!==i&&(k.cssHooks[i+o].set=Ze)}),k.fn.extend({css:function(e,t){return _(this,function(e,t,n){var r,i,o={},a=0;if(Array.isArray(t)){for(r=Fe(e),i=t.length;a<i;a++)o[t[a]]=k.css(e,t[a],!1,r);return o}return void 0!==n?k.style(e,t,n):k.css(e,t)},e,t,1<arguments.length)}}),((k.Tween=nt).prototype={constructor:nt,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||k.easing._default,this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(k.cssNumber[n]?"":"px")},cur:function(){var e=nt.propHooks[this.prop];return e&&e.get?e.get(this):nt.propHooks._default.get(this)},run:function(e){var t,n=nt.propHooks[this.prop];return this.options.duration?this.pos=t=k.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):this.pos=t=e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):nt.propHooks._default.set(this),this}}).init.prototype=nt.prototype,(nt.propHooks={_default:{get:function(e){var t;return 1!==e.elem.nodeType||null!=e.elem[e.prop]&&null==e.elem.style[e.prop]?e.elem[e.prop]:(t=k.css(e.elem,e.prop,""))&&"auto"!==t?t:0},set:function(e){k.fx.step[e.prop]?k.fx.step[e.prop](e):1!==e.elem.nodeType||!k.cssHooks[e.prop]&&null==e.elem.style[Ge(e.prop)]?e.elem[e.prop]=e.now:k.style(e.elem,e.prop,e.now+e.unit)}}}).scrollTop=nt.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},k.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2},_default:"swing"},k.fx=nt.prototype.init,k.fx.step={};var rt,it,ot,at,st=/^(?:toggle|show|hide)$/,ut=/queueHooks$/;function lt(){it&&(!1===E.hidden&&C.requestAnimationFrame?C.requestAnimationFrame(lt):C.setTimeout(lt,k.fx.interval),k.fx.tick())}function ct(){return C.setTimeout(function(){rt=void 0}),rt=Date.now()}function ft(e,t){var n,r=0,i={height:e};for(t=t?1:0;r<4;r+=2-t)i["margin"+(n=re[r])]=i["padding"+n]=e;return t&&(i.opacity=i.width=e),i}function pt(e,t,n){for(var r,i=(dt.tweeners[t]||[]).concat(dt.tweeners["*"]),o=0,a=i.length;o<a;o++)if(r=i[o].call(n,t,e))return r}function dt(o,e,t){var n,a,r=0,i=dt.prefilters.length,s=k.Deferred().always(function(){delete u.elem}),u=function(){if(a)return!1;for(var e=rt||ct(),t=Math.max(0,l.startTime+l.duration-e),n=1-(t/l.duration||0),r=0,i=l.tweens.length;r<i;r++)l.tweens[r].run(n);return s.notifyWith(o,[l,n,t]),n<1&&i?t:(i||s.notifyWith(o,[l,1,0]),s.resolveWith(o,[l]),!1)},l=s.promise({elem:o,props:k.extend({},e),opts:k.extend(!0,{specialEasing:{},easing:k.easing._default},t),originalProperties:e,originalOptions:t,startTime:rt||ct(),duration:t.duration,tweens:[],createTween:function(e,t){var n=k.Tween(o,l.opts,e,t,l.opts.specialEasing[e]||l.opts.easing);return l.tweens.push(n),n},stop:function(e){var t=0,n=e?l.tweens.length:0;if(a)return this;for(a=!0;t<n;t++)l.tweens[t].run(1);return e?(s.notifyWith(o,[l,1,0]),s.resolveWith(o,[l,e])):s.rejectWith(o,[l,e]),this}}),c=l.props;for(!function(e,t){var n,r,i,o,a;for(n in e)if(i=t[r=V(n)],o=e[n],Array.isArray(o)&&(i=o[1],o=e[n]=o[0]),n!==r&&(e[r]=o,delete e[n]),(a=k.cssHooks[r])&&"expand"in a)for(n in o=a.expand(o),delete e[r],o)n in e||(e[n]=o[n],t[n]=i);else t[r]=i}(c,l.opts.specialEasing);r<i;r++)if(n=dt.prefilters[r].call(l,o,c,l.opts))return m(n.stop)&&(k._queueHooks(l.elem,l.opts.queue).stop=n.stop.bind(n)),n;return k.map(c,pt,l),m(l.opts.start)&&l.opts.start.call(o,l),l.progress(l.opts.progress).done(l.opts.done,l.opts.complete).fail(l.opts.fail).always(l.opts.always),k.fx.timer(k.extend(u,{elem:o,anim:l,queue:l.opts.queue})),l}k.Animation=k.extend(dt,{tweeners:{"*":[function(e,t){var n=this.createTween(e,t);return le(n.elem,e,ne.exec(t),n),n}]},tweener:function(e,t){m(e)?(t=e,e=["*"]):e=e.match(R);for(var n,r=0,i=e.length;r<i;r++)n=e[r],dt.tweeners[n]=dt.tweeners[n]||[],dt.tweeners[n].unshift(t)},prefilters:[function(e,t,n){var r,i,o,a,s,u,l,c,f="width"in t||"height"in t,p=this,d={},h=e.style,g=e.nodeType&&se(e),v=Q.get(e,"fxshow");for(r in n.queue||(null==(a=k._queueHooks(e,"fx")).unqueued&&(a.unqueued=0,s=a.empty.fire,a.empty.fire=function(){a.unqueued||s()}),a.unqueued++,p.always(function(){p.always(function(){a.unqueued--,k.queue(e,"fx").length||a.empty.fire()})})),t)if(i=t[r],st.test(i)){if(delete t[r],o=o||"toggle"===i,i===(g?"hide":"show")){if("show"!==i||!v||void 0===v[r])continue;g=!0}d[r]=v&&v[r]||k.style(e,r)}if((u=!k.isEmptyObject(t))||!k.isEmptyObject(d))for(r in f&&1===e.nodeType&&(n.overflow=[h.overflow,h.overflowX,h.overflowY],null==(l=v&&v.display)&&(l=Q.get(e,"display")),"none"===(c=k.css(e,"display"))&&(l?c=l:(fe([e],!0),l=e.style.display||l,c=k.css(e,"display"),fe([e]))),("inline"===c||"inline-block"===c&&null!=l)&&"none"===k.css(e,"float")&&(u||(p.done(function(){h.display=l}),null==l&&(c=h.display,l="none"===c?"":c)),h.display="inline-block")),n.overflow&&(h.overflow="hidden",p.always(function(){h.overflow=n.overflow[0],h.overflowX=n.overflow[1],h.overflowY=n.overflow[2]})),u=!1,d)u||(v?"hidden"in v&&(g=v.hidden):v=Q.access(e,"fxshow",{display:l}),o&&(v.hidden=!g),g&&fe([e],!0),p.done(function(){for(r in g||fe([e]),Q.remove(e,"fxshow"),d)k.style(e,r,d[r])})),u=pt(g?v[r]:0,r,p),r in v||(v[r]=u.start,g&&(u.end=u.start,u.start=0))}],prefilter:function(e,t){t?dt.prefilters.unshift(e):dt.prefilters.push(e)}}),k.speed=function(e,t,n){var r=e&&"object"==typeof e?k.extend({},e):{complete:n||!n&&t||m(e)&&e,duration:e,easing:n&&t||t&&!m(t)&&t};return k.fx.off?r.duration=0:"number"!=typeof r.duration&&(r.duration in k.fx.speeds?r.duration=k.fx.speeds[r.duration]:r.duration=k.fx.speeds._default),null!=r.queue&&!0!==r.queue||(r.queue="fx"),r.old=r.complete,r.complete=function(){m(r.old)&&r.old.call(this),r.queue&&k.dequeue(this,r.queue)},r},k.fn.extend({fadeTo:function(e,t,n,r){return this.filter(se).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(t,e,n,r){var i=k.isEmptyObject(t),o=k.speed(e,n,r),a=function(){var e=dt(this,k.extend({},t),o);(i||Q.get(this,"finish"))&&e.stop(!0)};return a.finish=a,i||!1===o.queue?this.each(a):this.queue(o.queue,a)},stop:function(i,e,o){var a=function(e){var t=e.stop;delete e.stop,t(o)};return"string"!=typeof i&&(o=e,e=i,i=void 0),e&&!1!==i&&this.queue(i||"fx",[]),this.each(function(){var e=!0,t=null!=i&&i+"queueHooks",n=k.timers,r=Q.get(this);if(t)r[t]&&r[t].stop&&a(r[t]);else for(t in r)r[t]&&r[t].stop&&ut.test(t)&&a(r[t]);for(t=n.length;t--;)n[t].elem!==this||null!=i&&n[t].queue!==i||(n[t].anim.stop(o),e=!1,n.splice(t,1));!e&&o||k.dequeue(this,i)})},finish:function(a){return!1!==a&&(a=a||"fx"),this.each(function(){var e,t=Q.get(this),n=t[a+"queue"],r=t[a+"queueHooks"],i=k.timers,o=n?n.length:0;for(t.finish=!0,k.queue(this,a,[]),r&&r.stop&&r.stop.call(this,!0),e=i.length;e--;)i[e].elem===this&&i[e].queue===a&&(i[e].anim.stop(!0),i.splice(e,1));for(e=0;e<o;e++)n[e]&&n[e].finish&&n[e].finish.call(this);delete t.finish})}}),k.each(["toggle","show","hide"],function(e,r){var i=k.fn[r];k.fn[r]=function(e,t,n){return null==e||"boolean"==typeof e?i.apply(this,arguments):this.animate(ft(r,!0),e,t,n)}}),k.each({slideDown:ft("show"),slideUp:ft("hide"),slideToggle:ft("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,r){k.fn[e]=function(e,t,n){return this.animate(r,e,t,n)}}),k.timers=[],k.fx.tick=function(){var e,t=0,n=k.timers;for(rt=Date.now();t<n.length;t++)(e=n[t])()||n[t]!==e||n.splice(t--,1);n.length||k.fx.stop(),rt=void 0},k.fx.timer=function(e){k.timers.push(e),k.fx.start()},k.fx.interval=13,k.fx.start=function(){it||(it=!0,lt())},k.fx.stop=function(){it=null},k.fx.speeds={slow:600,fast:200,_default:400},k.fn.delay=function(r,e){return r=k.fx&&k.fx.speeds[r]||r,e=e||"fx",this.queue(e,function(e,t){var n=C.setTimeout(e,r);t.stop=function(){C.clearTimeout(n)}})},ot=E.createElement("input"),at=E.createElement("select").appendChild(E.createElement("option")),ot.type="checkbox",y.checkOn=""!==ot.value,y.optSelected=at.selected,(ot=E.createElement("input")).value="t",ot.type="radio",y.radioValue="t"===ot.value;var ht,gt=k.expr.attrHandle;k.fn.extend({attr:function(e,t){return _(this,k.attr,e,t,1<arguments.length)},removeAttr:function(e){return this.each(function(){k.removeAttr(this,e)})}}),k.extend({attr:function(e,t,n){var r,i,o=e.nodeType;if(3!==o&&8!==o&&2!==o)return"undefined"==typeof e.getAttribute?k.prop(e,t,n):(1===o&&k.isXMLDoc(e)||(i=k.attrHooks[t.toLowerCase()]||(k.expr.match.bool.test(t)?ht:void 0)),void 0!==n?null===n?void k.removeAttr(e,t):i&&"set"in i&&void 0!==(r=i.set(e,n,t))?r:(e.setAttribute(t,n+""),n):i&&"get"in i&&null!==(r=i.get(e,t))?r:null==(r=k.find.attr(e,t))?void 0:r)},attrHooks:{type:{set:function(e,t){if(!y.radioValue&&"radio"===t&&A(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},removeAttr:function(e,t){var n,r=0,i=t&&t.match(R);if(i&&1===e.nodeType)while(n=i[r++])e.removeAttribute(n)}}),ht={set:function(e,t,n){return!1===t?k.removeAttr(e,n):e.setAttribute(n,n),n}},k.each(k.expr.match.bool.source.match(/\w+/g),function(e,t){var a=gt[t]||k.find.attr;gt[t]=function(e,t,n){var r,i,o=t.toLowerCase();return n||(i=gt[o],gt[o]=r,r=null!=a(e,t,n)?o:null,gt[o]=i),r}});var vt=/^(?:input|select|textarea|button)$/i,yt=/^(?:a|area)$/i;function mt(e){return(e.match(R)||[]).join(" ")}function xt(e){return e.getAttribute&&e.getAttribute("class")||""}function bt(e){return Array.isArray(e)?e:"string"==typeof e&&e.match(R)||[]}k.fn.extend({prop:function(e,t){return _(this,k.prop,e,t,1<arguments.length)},removeProp:function(e){return this.each(function(){delete this[k.propFix[e]||e]})}}),k.extend({prop:function(e,t,n){var r,i,o=e.nodeType;if(3!==o&&8!==o&&2!==o)return 1===o&&k.isXMLDoc(e)||(t=k.propFix[t]||t,i=k.propHooks[t]),void 0!==n?i&&"set"in i&&void 0!==(r=i.set(e,n,t))?r:e[t]=n:i&&"get"in i&&null!==(r=i.get(e,t))?r:e[t]},propHooks:{tabIndex:{get:function(e){var t=k.find.attr(e,"tabindex");return t?parseInt(t,10):vt.test(e.nodeName)||yt.test(e.nodeName)&&e.href?0:-1}}},propFix:{"for":"htmlFor","class":"className"}}),y.optSelected||(k.propHooks.selected={get:function(e){var t=e.parentNode;return t&&t.parentNode&&t.parentNode.selectedIndex,null},set:function(e){var t=e.parentNode;t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex)}}),k.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){k.propFix[this.toLowerCase()]=this}),k.fn.extend({addClass:function(t){var e,n,r,i,o,a,s,u=0;if(m(t))return this.each(function(e){k(this).addClass(t.call(this,e,xt(this)))});if((e=bt(t)).length)while(n=this[u++])if(i=xt(n),r=1===n.nodeType&&" "+mt(i)+" "){a=0;while(o=e[a++])r.indexOf(" "+o+" ")<0&&(r+=o+" ");i!==(s=mt(r))&&n.setAttribute("class",s)}return this},removeClass:function(t){var e,n,r,i,o,a,s,u=0;if(m(t))return this.each(function(e){k(this).removeClass(t.call(this,e,xt(this)))});if(!arguments.length)return this.attr("class","");if((e=bt(t)).length)while(n=this[u++])if(i=xt(n),r=1===n.nodeType&&" "+mt(i)+" "){a=0;while(o=e[a++])while(-1<r.indexOf(" "+o+" "))r=r.replace(" "+o+" "," ");i!==(s=mt(r))&&n.setAttribute("class",s)}return this},toggleClass:function(i,t){var o=typeof i,a="string"===o||Array.isArray(i);return"boolean"==typeof t&&a?t?this.addClass(i):this.removeClass(i):m(i)?this.each(function(e){k(this).toggleClass(i.call(this,e,xt(this),t),t)}):this.each(function(){var e,t,n,r;if(a){t=0,n=k(this),r=bt(i);while(e=r[t++])n.hasClass(e)?n.removeClass(e):n.addClass(e)}else void 0!==i&&"boolean"!==o||((e=xt(this))&&Q.set(this,"__className__",e),this.setAttribute&&this.setAttribute("class",e||!1===i?"":Q.get(this,"__className__")||""))})},hasClass:function(e){var t,n,r=0;t=" "+e+" ";while(n=this[r++])if(1===n.nodeType&&-1<(" "+mt(xt(n))+" ").indexOf(t))return!0;return!1}});var wt=/\r/g;k.fn.extend({val:function(n){var r,e,i,t=this[0];return arguments.length?(i=m(n),this.each(function(e){var t;1===this.nodeType&&(null==(t=i?n.call(this,e,k(this).val()):n)?t="":"number"==typeof t?t+="":Array.isArray(t)&&(t=k.map(t,function(e){return null==e?"":e+""})),(r=k.valHooks[this.type]||k.valHooks[this.nodeName.toLowerCase()])&&"set"in r&&void 0!==r.set(this,t,"value")||(this.value=t))})):t?(r=k.valHooks[t.type]||k.valHooks[t.nodeName.toLowerCase()])&&"get"in r&&void 0!==(e=r.get(t,"value"))?e:"string"==typeof(e=t.value)?e.replace(wt,""):null==e?"":e:void 0}}),k.extend({valHooks:{option:{get:function(e){var t=k.find.attr(e,"value");return null!=t?t:mt(k.text(e))}},select:{get:function(e){var t,n,r,i=e.options,o=e.selectedIndex,a="select-one"===e.type,s=a?null:[],u=a?o+1:i.length;for(r=o<0?u:a?o:0;r<u;r++)if(((n=i[r]).selected||r===o)&&!n.disabled&&(!n.parentNode.disabled||!A(n.parentNode,"optgroup"))){if(t=k(n).val(),a)return t;s.push(t)}return s},set:function(e,t){var n,r,i=e.options,o=k.makeArray(t),a=i.length;while(a--)((r=i[a]).selected=-1<k.inArray(k.valHooks.option.get(r),o))&&(n=!0);return n||(e.selectedIndex=-1),o}}}}),k.each(["radio","checkbox"],function(){k.valHooks[this]={set:function(e,t){if(Array.isArray(t))return e.checked=-1<k.inArray(k(e).val(),t)}},y.checkOn||(k.valHooks[this].get=function(e){return null===e.getAttribute("value")?"on":e.value})}),y.focusin="onfocusin"in C;var Tt=/^(?:focusinfocus|focusoutblur)$/,Ct=function(e){e.stopPropagation()};k.extend(k.event,{trigger:function(e,t,n,r){var i,o,a,s,u,l,c,f,p=[n||E],d=v.call(e,"type")?e.type:e,h=v.call(e,"namespace")?e.namespace.split("."):[];if(o=f=a=n=n||E,3!==n.nodeType&&8!==n.nodeType&&!Tt.test(d+k.event.triggered)&&(-1<d.indexOf(".")&&(d=(h=d.split(".")).shift(),h.sort()),u=d.indexOf(":")<0&&"on"+d,(e=e[k.expando]?e:new k.Event(d,"object"==typeof e&&e)).isTrigger=r?2:3,e.namespace=h.join("."),e.rnamespace=e.namespace?new RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,e.result=void 0,e.target||(e.target=n),t=null==t?[e]:k.makeArray(t,[e]),c=k.event.special[d]||{},r||!c.trigger||!1!==c.trigger.apply(n,t))){if(!r&&!c.noBubble&&!x(n)){for(s=c.delegateType||d,Tt.test(s+d)||(o=o.parentNode);o;o=o.parentNode)p.push(o),a=o;a===(n.ownerDocument||E)&&p.push(a.defaultView||a.parentWindow||C)}i=0;while((o=p[i++])&&!e.isPropagationStopped())f=o,e.type=1<i?s:c.bindType||d,(l=(Q.get(o,"events")||{})[e.type]&&Q.get(o,"handle"))&&l.apply(o,t),(l=u&&o[u])&&l.apply&&G(o)&&(e.result=l.apply(o,t),!1===e.result&&e.preventDefault());return e.type=d,r||e.isDefaultPrevented()||c._default&&!1!==c._default.apply(p.pop(),t)||!G(n)||u&&m(n[d])&&!x(n)&&((a=n[u])&&(n[u]=null),k.event.triggered=d,e.isPropagationStopped()&&f.addEventListener(d,Ct),n[d](),e.isPropagationStopped()&&f.removeEventListener(d,Ct),k.event.triggered=void 0,a&&(n[u]=a)),e.result}},simulate:function(e,t,n){var r=k.extend(new k.Event,n,{type:e,isSimulated:!0});k.event.trigger(r,null,t)}}),k.fn.extend({trigger:function(e,t){return this.each(function(){k.event.trigger(e,t,this)})},triggerHandler:function(e,t){var n=this[0];if(n)return k.event.trigger(e,t,n,!0)}}),y.focusin||k.each({focus:"focusin",blur:"focusout"},function(n,r){var i=function(e){k.event.simulate(r,e.target,k.event.fix(e))};k.event.special[r]={setup:function(){var e=this.ownerDocument||this,t=Q.access(e,r);t||e.addEventListener(n,i,!0),Q.access(e,r,(t||0)+1)},teardown:function(){var e=this.ownerDocument||this,t=Q.access(e,r)-1;t?Q.access(e,r,t):(e.removeEventListener(n,i,!0),Q.remove(e,r))}}});var Et=C.location,kt=Date.now(),St=/\?/;k.parseXML=function(e){var t;if(!e||"string"!=typeof e)return null;try{t=(new C.DOMParser).parseFromString(e,"text/xml")}catch(e){t=void 0}return t&&!t.getElementsByTagName("parsererror").length||k.error("Invalid XML: "+e),t};var Nt=/\[\]$/,At=/\r?\n/g,Dt=/^(?:submit|button|image|reset|file)$/i,jt=/^(?:input|select|textarea|keygen)/i;function qt(n,e,r,i){var t;if(Array.isArray(e))k.each(e,function(e,t){r||Nt.test(n)?i(n,t):qt(n+"["+("object"==typeof t&&null!=t?e:"")+"]",t,r,i)});else if(r||"object"!==w(e))i(n,e);else for(t in e)qt(n+"["+t+"]",e[t],r,i)}k.param=function(e,t){var n,r=[],i=function(e,t){var n=m(t)?t():t;r[r.length]=encodeURIComponent(e)+"="+encodeURIComponent(null==n?"":n)};if(null==e)return"";if(Array.isArray(e)||e.jquery&&!k.isPlainObject(e))k.each(e,function(){i(this.name,this.value)});else for(n in e)qt(n,e[n],t,i);return r.join("&")},k.fn.extend({serialize:function(){return k.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=k.prop(this,"elements");return e?k.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!k(this).is(":disabled")&&jt.test(this.nodeName)&&!Dt.test(e)&&(this.checked||!pe.test(e))}).map(function(e,t){var n=k(this).val();return null==n?null:Array.isArray(n)?k.map(n,function(e){return{name:t.name,value:e.replace(At,"\r\n")}}):{name:t.name,value:n.replace(At,"\r\n")}}).get()}});var Lt=/%20/g,Ht=/#.*$/,Ot=/([?&])_=[^&]*/,Pt=/^(.*?):[ \t]*([^\r\n]*)$/gm,Rt=/^(?:GET|HEAD)$/,Mt=/^\/\//,It={},Wt={},$t="*/".concat("*"),Ft=E.createElement("a");function Bt(o){return function(e,t){"string"!=typeof e&&(t=e,e="*");var n,r=0,i=e.toLowerCase().match(R)||[];if(m(t))while(n=i[r++])"+"===n[0]?(n=n.slice(1)||"*",(o[n]=o[n]||[]).unshift(t)):(o[n]=o[n]||[]).push(t)}}function _t(t,i,o,a){var s={},u=t===Wt;function l(e){var r;return s[e]=!0,k.each(t[e]||[],function(e,t){var n=t(i,o,a);return"string"!=typeof n||u||s[n]?u?!(r=n):void 0:(i.dataTypes.unshift(n),l(n),!1)}),r}return l(i.dataTypes[0])||!s["*"]&&l("*")}function zt(e,t){var n,r,i=k.ajaxSettings.flatOptions||{};for(n in t)void 0!==t[n]&&((i[n]?e:r||(r={}))[n]=t[n]);return r&&k.extend(!0,e,r),e}Ft.href=Et.href,k.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:Et.href,type:"GET",isLocal:/^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(Et.protocol),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":$t,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/\bxml\b/,html:/\bhtml/,json:/\bjson\b/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":JSON.parse,"text xml":k.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?zt(zt(e,k.ajaxSettings),t):zt(k.ajaxSettings,e)},ajaxPrefilter:Bt(It),ajaxTransport:Bt(Wt),ajax:function(e,t){"object"==typeof e&&(t=e,e=void 0),t=t||{};var c,f,p,n,d,r,h,g,i,o,v=k.ajaxSetup({},t),y=v.context||v,m=v.context&&(y.nodeType||y.jquery)?k(y):k.event,x=k.Deferred(),b=k.Callbacks("once memory"),w=v.statusCode||{},a={},s={},u="canceled",T={readyState:0,getResponseHeader:function(e){var t;if(h){if(!n){n={};while(t=Pt.exec(p))n[t[1].toLowerCase()+" "]=(n[t[1].toLowerCase()+" "]||[]).concat(t[2])}t=n[e.toLowerCase()+" "]}return null==t?null:t.join(", ")},getAllResponseHeaders:function(){return h?p:null},setRequestHeader:function(e,t){return null==h&&(e=s[e.toLowerCase()]=s[e.toLowerCase()]||e,a[e]=t),this},overrideMimeType:function(e){return null==h&&(v.mimeType=e),this},statusCode:function(e){var t;if(e)if(h)T.always(e[T.status]);else for(t in e)w[t]=[w[t],e[t]];return this},abort:function(e){var t=e||u;return c&&c.abort(t),l(0,t),this}};if(x.promise(T),v.url=((e||v.url||Et.href)+"").replace(Mt,Et.protocol+"//"),v.type=t.method||t.type||v.method||v.type,v.dataTypes=(v.dataType||"*").toLowerCase().match(R)||[""],null==v.crossDomain){r=E.createElement("a");try{r.href=v.url,r.href=r.href,v.crossDomain=Ft.protocol+"//"+Ft.host!=r.protocol+"//"+r.host}catch(e){v.crossDomain=!0}}if(v.data&&v.processData&&"string"!=typeof v.data&&(v.data=k.param(v.data,v.traditional)),_t(It,v,t,T),h)return T;for(i in(g=k.event&&v.global)&&0==k.active++&&k.event.trigger("ajaxStart"),v.type=v.type.toUpperCase(),v.hasContent=!Rt.test(v.type),f=v.url.replace(Ht,""),v.hasContent?v.data&&v.processData&&0===(v.contentType||"").indexOf("application/x-www-form-urlencoded")&&(v.data=v.data.replace(Lt,"+")):(o=v.url.slice(f.length),v.data&&(v.processData||"string"==typeof v.data)&&(f+=(St.test(f)?"&":"?")+v.data,delete v.data),!1===v.cache&&(f=f.replace(Ot,"$1"),o=(St.test(f)?"&":"?")+"_="+kt+++o),v.url=f+o),v.ifModified&&(k.lastModified[f]&&T.setRequestHeader("If-Modified-Since",k.lastModified[f]),k.etag[f]&&T.setRequestHeader("If-None-Match",k.etag[f])),(v.data&&v.hasContent&&!1!==v.contentType||t.contentType)&&T.setRequestHeader("Content-Type",v.contentType),T.setRequestHeader("Accept",v.dataTypes[0]&&v.accepts[v.dataTypes[0]]?v.accepts[v.dataTypes[0]]+("*"!==v.dataTypes[0]?", "+$t+"; q=0.01":""):v.accepts["*"]),v.headers)T.setRequestHeader(i,v.headers[i]);if(v.beforeSend&&(!1===v.beforeSend.call(y,T,v)||h))return T.abort();if(u="abort",b.add(v.complete),T.done(v.success),T.fail(v.error),c=_t(Wt,v,t,T)){if(T.readyState=1,g&&m.trigger("ajaxSend",[T,v]),h)return T;v.async&&0<v.timeout&&(d=C.setTimeout(function(){T.abort("timeout")},v.timeout));try{h=!1,c.send(a,l)}catch(e){if(h)throw e;l(-1,e)}}else l(-1,"No Transport");function l(e,t,n,r){var i,o,a,s,u,l=t;h||(h=!0,d&&C.clearTimeout(d),c=void 0,p=r||"",T.readyState=0<e?4:0,i=200<=e&&e<300||304===e,n&&(s=function(e,t,n){var r,i,o,a,s=e.contents,u=e.dataTypes;while("*"===u[0])u.shift(),void 0===r&&(r=e.mimeType||t.getResponseHeader("Content-Type"));if(r)for(i in s)if(s[i]&&s[i].test(r)){u.unshift(i);break}if(u[0]in n)o=u[0];else{for(i in n){if(!u[0]||e.converters[i+" "+u[0]]){o=i;break}a||(a=i)}o=o||a}if(o)return o!==u[0]&&u.unshift(o),n[o]}(v,T,n)),s=function(e,t,n,r){var i,o,a,s,u,l={},c=e.dataTypes.slice();if(c[1])for(a in e.converters)l[a.toLowerCase()]=e.converters[a];o=c.shift();while(o)if(e.responseFields[o]&&(n[e.responseFields[o]]=t),!u&&r&&e.dataFilter&&(t=e.dataFilter(t,e.dataType)),u=o,o=c.shift())if("*"===o)o=u;else if("*"!==u&&u!==o){if(!(a=l[u+" "+o]||l["* "+o]))for(i in l)if((s=i.split(" "))[1]===o&&(a=l[u+" "+s[0]]||l["* "+s[0]])){!0===a?a=l[i]:!0!==l[i]&&(o=s[0],c.unshift(s[1]));break}if(!0!==a)if(a&&e["throws"])t=a(t);else try{t=a(t)}catch(e){return{state:"parsererror",error:a?e:"No conversion from "+u+" to "+o}}}return{state:"success",data:t}}(v,s,T,i),i?(v.ifModified&&((u=T.getResponseHeader("Last-Modified"))&&(k.lastModified[f]=u),(u=T.getResponseHeader("etag"))&&(k.etag[f]=u)),204===e||"HEAD"===v.type?l="nocontent":304===e?l="notmodified":(l=s.state,o=s.data,i=!(a=s.error))):(a=l,!e&&l||(l="error",e<0&&(e=0))),T.status=e,T.statusText=(t||l)+"",i?x.resolveWith(y,[o,l,T]):x.rejectWith(y,[T,l,a]),T.statusCode(w),w=void 0,g&&m.trigger(i?"ajaxSuccess":"ajaxError",[T,v,i?o:a]),b.fireWith(y,[T,l]),g&&(m.trigger("ajaxComplete",[T,v]),--k.active||k.event.trigger("ajaxStop")))}return T},getJSON:function(e,t,n){return k.get(e,t,n,"json")},getScript:function(e,t){return k.get(e,void 0,t,"script")}}),k.each(["get","post"],function(e,i){k[i]=function(e,t,n,r){return m(t)&&(r=r||n,n=t,t=void 0),k.ajax(k.extend({url:e,type:i,dataType:r,data:t,success:n},k.isPlainObject(e)&&e))}}),k._evalUrl=function(e,t){return k.ajax({url:e,type:"GET",dataType:"script",cache:!0,async:!1,global:!1,converters:{"text script":function(){}},dataFilter:function(e){k.globalEval(e,t)}})},k.fn.extend({wrapAll:function(e){var t;return this[0]&&(m(e)&&(e=e.call(this[0])),t=k(e,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstElementChild)e=e.firstElementChild;return e}).append(this)),this},wrapInner:function(n){return m(n)?this.each(function(e){k(this).wrapInner(n.call(this,e))}):this.each(function(){var e=k(this),t=e.contents();t.length?t.wrapAll(n):e.append(n)})},wrap:function(t){var n=m(t);return this.each(function(e){k(this).wrapAll(n?t.call(this,e):t)})},unwrap:function(e){return this.parent(e).not("body").each(function(){k(this).replaceWith(this.childNodes)}),this}}),k.expr.pseudos.hidden=function(e){return!k.expr.pseudos.visible(e)},k.expr.pseudos.visible=function(e){return!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)},k.ajaxSettings.xhr=function(){try{return new C.XMLHttpRequest}catch(e){}};var Ut={0:200,1223:204},Xt=k.ajaxSettings.xhr();y.cors=!!Xt&&"withCredentials"in Xt,y.ajax=Xt=!!Xt,k.ajaxTransport(function(i){var o,a;if(y.cors||Xt&&!i.crossDomain)return{send:function(e,t){var n,r=i.xhr();if(r.open(i.type,i.url,i.async,i.username,i.password),i.xhrFields)for(n in i.xhrFields)r[n]=i.xhrFields[n];for(n in i.mimeType&&r.overrideMimeType&&r.overrideMimeType(i.mimeType),i.crossDomain||e["X-Requested-With"]||(e["X-Requested-With"]="XMLHttpRequest"),e)r.setRequestHeader(n,e[n]);o=function(e){return function(){o&&(o=a=r.onload=r.onerror=r.onabort=r.ontimeout=r.onreadystatechange=null,"abort"===e?r.abort():"error"===e?"number"!=typeof r.status?t(0,"error"):t(r.status,r.statusText):t(Ut[r.status]||r.status,r.statusText,"text"!==(r.responseType||"text")||"string"!=typeof r.responseText?{binary:r.response}:{text:r.responseText},r.getAllResponseHeaders()))}},r.onload=o(),a=r.onerror=r.ontimeout=o("error"),void 0!==r.onabort?r.onabort=a:r.onreadystatechange=function(){4===r.readyState&&C.setTimeout(function(){o&&a()})},o=o("abort");try{r.send(i.hasContent&&i.data||null)}catch(e){if(o)throw e}},abort:function(){o&&o()}}}),k.ajaxPrefilter(function(e){e.crossDomain&&(e.contents.script=!1)}),k.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/\b(?:java|ecma)script\b/},converters:{"text script":function(e){return k.globalEval(e),e}}}),k.ajaxPrefilter("script",function(e){void 0===e.cache&&(e.cache=!1),e.crossDomain&&(e.type="GET")}),k.ajaxTransport("script",function(n){var r,i;if(n.crossDomain||n.scriptAttrs)return{send:function(e,t){r=k("<script>").attr(n.scriptAttrs||{}).prop({charset:n.scriptCharset,src:n.url}).on("load error",i=function(e){r.remove(),i=null,e&&t("error"===e.type?404:200,e.type)}),E.head.appendChild(r[0])},abort:function(){i&&i()}}});var Vt,Gt=[],Yt=/(=)\?(?=&|$)|\?\?/;k.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=Gt.pop()||k.expando+"_"+kt++;return this[e]=!0,e}}),k.ajaxPrefilter("json jsonp",function(e,t,n){var r,i,o,a=!1!==e.jsonp&&(Yt.test(e.url)?"url":"string"==typeof e.data&&0===(e.contentType||"").indexOf("application/x-www-form-urlencoded")&&Yt.test(e.data)&&"data");if(a||"jsonp"===e.dataTypes[0])return r=e.jsonpCallback=m(e.jsonpCallback)?e.jsonpCallback():e.jsonpCallback,a?e[a]=e[a].replace(Yt,"$1"+r):!1!==e.jsonp&&(e.url+=(St.test(e.url)?"&":"?")+e.jsonp+"="+r),e.converters["script json"]=function(){return o||k.error(r+" was not called"),o[0]},e.dataTypes[0]="json",i=C[r],C[r]=function(){o=arguments},n.always(function(){void 0===i?k(C).removeProp(r):C[r]=i,e[r]&&(e.jsonpCallback=t.jsonpCallback,Gt.push(r)),o&&m(i)&&i(o[0]),o=i=void 0}),"script"}),y.createHTMLDocument=((Vt=E.implementation.createHTMLDocument("").body).innerHTML="<form></form><form></form>",2===Vt.childNodes.length),k.parseHTML=function(e,t,n){return"string"!=typeof e?[]:("boolean"==typeof t&&(n=t,t=!1),t||(y.createHTMLDocument?((r=(t=E.implementation.createHTMLDocument("")).createElement("base")).href=E.location.href,t.head.appendChild(r)):t=E),o=!n&&[],(i=D.exec(e))?[t.createElement(i[1])]:(i=we([e],t,o),o&&o.length&&k(o).remove(),k.merge([],i.childNodes)));var r,i,o},k.fn.load=function(e,t,n){var r,i,o,a=this,s=e.indexOf(" ");return-1<s&&(r=mt(e.slice(s)),e=e.slice(0,s)),m(t)?(n=t,t=void 0):t&&"object"==typeof t&&(i="POST"),0<a.length&&k.ajax({url:e,type:i||"GET",dataType:"html",data:t}).done(function(e){o=arguments,a.html(r?k("<div>").append(k.parseHTML(e)).find(r):e)}).always(n&&function(e,t){a.each(function(){n.apply(this,o||[e.responseText,t,e])})}),this},k.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){k.fn[t]=function(e){return this.on(t,e)}}),k.expr.pseudos.animated=function(t){return k.grep(k.timers,function(e){return t===e.elem}).length},k.offset={setOffset:function(e,t,n){var r,i,o,a,s,u,l=k.css(e,"position"),c=k(e),f={};"static"===l&&(e.style.position="relative"),s=c.offset(),o=k.css(e,"top"),u=k.css(e,"left"),("absolute"===l||"fixed"===l)&&-1<(o+u).indexOf("auto")?(a=(r=c.position()).top,i=r.left):(a=parseFloat(o)||0,i=parseFloat(u)||0),m(t)&&(t=t.call(e,n,k.extend({},s))),null!=t.top&&(f.top=t.top-s.top+a),null!=t.left&&(f.left=t.left-s.left+i),"using"in t?t.using.call(e,f):c.css(f)}},k.fn.extend({offset:function(t){if(arguments.length)return void 0===t?this:this.each(function(e){k.offset.setOffset(this,t,e)});var e,n,r=this[0];return r?r.getClientRects().length?(e=r.getBoundingClientRect(),n=r.ownerDocument.defaultView,{top:e.top+n.pageYOffset,left:e.left+n.pageXOffset}):{top:0,left:0}:void 0},position:function(){if(this[0]){var e,t,n,r=this[0],i={top:0,left:0};if("fixed"===k.css(r,"position"))t=r.getBoundingClientRect();else{t=this.offset(),n=r.ownerDocument,e=r.offsetParent||n.documentElement;while(e&&(e===n.body||e===n.documentElement)&&"static"===k.css(e,"position"))e=e.parentNode;e&&e!==r&&1===e.nodeType&&((i=k(e).offset()).top+=k.css(e,"borderTopWidth",!0),i.left+=k.css(e,"borderLeftWidth",!0))}return{top:t.top-i.top-k.css(r,"marginTop",!0),left:t.left-i.left-k.css(r,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent;while(e&&"static"===k.css(e,"position"))e=e.offsetParent;return e||ie})}}),k.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(t,i){var o="pageYOffset"===i;k.fn[t]=function(e){return _(this,function(e,t,n){var r;if(x(e)?r=e:9===e.nodeType&&(r=e.defaultView),void 0===n)return r?r[i]:e[t];r?r.scrollTo(o?r.pageXOffset:n,o?n:r.pageYOffset):e[t]=n},t,e,arguments.length)}}),k.each(["top","left"],function(e,n){k.cssHooks[n]=ze(y.pixelPosition,function(e,t){if(t)return t=_e(e,n),$e.test(t)?k(e).position()[n]+"px":t})}),k.each({Height:"height",Width:"width"},function(a,s){k.each({padding:"inner"+a,content:s,"":"outer"+a},function(r,o){k.fn[o]=function(e,t){var n=arguments.length&&(r||"boolean"!=typeof e),i=r||(!0===e||!0===t?"margin":"border");return _(this,function(e,t,n){var r;return x(e)?0===o.indexOf("outer")?e["inner"+a]:e.document.documentElement["client"+a]:9===e.nodeType?(r=e.documentElement,Math.max(e.body["scroll"+a],r["scroll"+a],e.body["offset"+a],r["offset"+a],r["client"+a])):void 0===n?k.css(e,t,i):k.style(e,t,n,i)},s,n?e:void 0,n)}})}),k.each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),function(e,n){k.fn[n]=function(e,t){return 0<arguments.length?this.on(n,null,e,t):this.trigger(n)}}),k.fn.extend({hover:function(e,t){return this.mouseenter(e).mouseleave(t||e)}}),k.fn.extend({bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)}}),k.proxy=function(e,t){var n,r,i;if("string"==typeof t&&(n=e[t],t=e,e=n),m(e))return r=s.call(arguments,2),(i=function(){return e.apply(t||this,r.concat(s.call(arguments)))}).guid=e.guid=e.guid||k.guid++,i},k.holdReady=function(e){e?k.readyWait++:k.ready(!0)},k.isArray=Array.isArray,k.parseJSON=JSON.parse,k.nodeName=A,k.isFunction=m,k.isWindow=x,k.camelCase=V,k.type=w,k.now=Date.now,k.isNumeric=function(e){var t=k.type(e);return("number"===t||"string"===t)&&!isNaN(e-parseFloat(e))},"function"==typeof define&&define.amd&&define("jquery",[],function(){return k});var Qt=C.jQuery,Jt=C.$;return k.noConflict=function(e){return C.$===k&&(C.$=Jt),e&&C.jQuery===k&&(C.jQuery=Qt),k},e||(C.jQuery=C.$=k),k});

;(function(factory) {
    //CommonJS
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        factory(require("ko"), exports);
    //AMD
    } else if (typeof define === "function" && define.amd) {
        define('postbox',["ko", "exports"], factory);
    //normal script tag
    } else {
        factory(ko, ko.postbox = {});
    }
}(function(ko, exports, undefined) {
    var disposeTopicSubscription, ensureDispose, existingSubscribe,
        subscriptions = {},
        subId = 1;

    exports.subscriptions = subscriptions;

    //create a global postbox that supports subscribing/publishing
    ko.subscribable.call(exports);

    //keep a cache of the latest value and subscribers
    exports.topicCache = {};

    //allow customization of the function used to serialize values for the topic cache
    exports.serializer = ko.toJSON;

    //wrap notifySubscribers passing topic first and caching latest value
    exports.publish = function(topic, value) {
        if (topic) {
            //keep the value and a serialized version for comparison
            exports.topicCache[topic] = {
                value: value,
                serialized: exports.serializer(value)
            };
            exports.notifySubscribers(value, topic);
        }
    };

    //provide a subscribe API for the postbox that takes in the topic as first arg
    existingSubscribe = exports.subscribe;
    exports.subscribe = function(topic, action, target, initializeWithLatestValue) {
        var subscription, current, existingDispose;

        if (topic) {
            if (typeof target === "boolean") {
                initializeWithLatestValue = target;
                target = undefined;
            }

            subscription = existingSubscribe.call(exports, action, target, topic);
            subscription.subId = ++subId;
            subscriptions[ subId ] = subscription;

            if (initializeWithLatestValue) {
                current = exports.topicCache[topic];

                if (current !== undefined) {
                    action.call(target, current.value);
                }
            }

            existingDispose = subscription.dispose;
            subscription.dispose = function() {
                delete subscriptions[subscription.subId];
                existingDispose.call(subscription);
            };

            return subscription;
        }
    };

    //clean up all subscriptions and references
    exports.reset = function() {
        var subscription;

        for (var id in subscriptions) {
            if (subscriptions.hasOwnProperty(id)) {
                subscription = subscriptions[id];

                if (subscription && typeof subscription.dispose === "function") {
                    subscription.dispose();
                }
            }
        }

        exports.topicCache = {};
    };

    //by default publish when the previous cached value does not equal the new value
    exports.defaultComparer = function(newValue, cacheItem) {
        return cacheItem && exports.serializer(newValue) === cacheItem.serialized;
    };

    // Ensures that a `subscribable` has a `dispose` method which cleans up all
    // subscriptions added by `knockout-postbox`.
    ensureDispose = function() {
        var existingDispose,
            self = this;

        // Make sure we're adding the custom `dispose` method at most once.
        if (!self.willDisposePostbox) {
            self.willDisposePostbox = true;

            existingDispose = self.dispose;
            self.dispose = function() {
                var topic, types, type, sub,
                    subs = self.postboxSubs;

                if (subs) {
                    for (topic in subs) {
                        if (subs.hasOwnProperty(topic)) {
                            types = subs[topic];
                            if (types) {
                                for (type in types) {
                                    if (types.hasOwnProperty(type)) {
                                        sub = types[type];
                                        if (sub && typeof sub.dispose == "function") {
                                            sub.dispose();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if (existingDispose) {
                    existingDispose.call(self);
                }
            };
        }
    };

    //augment observables/computeds with the ability to automatically publish updates on a topic
    ko.subscribable.fn.publishOn = function(topic, skipInitialOrEqualityComparer, equalityComparer) {
        var skipInitialPublish, subscription, existingDispose;

        ensureDispose.call(this);

        if (topic) {
            //allow passing the equalityComparer as the second argument
            if (typeof skipInitialOrEqualityComparer === "function") {
                equalityComparer = skipInitialOrEqualityComparer;
            } else {
                skipInitialPublish = skipInitialOrEqualityComparer;
            }

            equalityComparer = equalityComparer || exports.defaultComparer;

            //remove any existing subs
            disposeTopicSubscription.call(this, topic, "publishOn");

            //keep a reference to the subscription, so we can stop publishing
            subscription = this.subscribe(function(newValue) {
                if (!equalityComparer.call(this, newValue, exports.topicCache[topic])) {
                    exports.publish(topic, newValue);
                }
            }, this);

            //track the subscription in case of a reset
            subscription.id = ++subId;
            subscriptions[subId] = subscription;

            //ensure that we cleanup pointers to subscription on dispose
            existingDispose = subscription.dispose;
            subscription.dispose = function() {
                delete this.postboxSubs[topic].publishOn;
                delete subscriptions[subscription.id];

                existingDispose.call(subscription);
            }.bind(this);

            this.postboxSubs[topic].publishOn = subscription;

            //do an initial publish
            if (!skipInitialPublish) {
                exports.publish(topic, this());
            }
        }

        return this;
    };

    //handle disposing a subscription used to publish or subscribe to a topic
    disposeTopicSubscription = function(topic, type) {
        var subs = this.postboxSubs = this.postboxSubs || {};
        subs[topic] = subs[topic] || {};

        if (subs[topic][type]) {
            subs[topic][type].dispose();
        }
    };

    //discontinue automatically publishing on a topic
    ko.subscribable.fn.stopPublishingOn = function(topic) {
        disposeTopicSubscription.call(this, topic, "publishOn");

        return this;
    };

    //augment observables/computeds to automatically be updated by notifications on a topic
    ko.subscribable.fn.subscribeTo = function(topic, initializeWithLatestValueOrTransform, transform) {
        var initializeWithLatestValue, current, callback, subscription, existingDispose,
            self = this;

        ensureDispose.call(this);

        //allow passing the filter as the second argument
        if (typeof initializeWithLatestValueOrTransform === "function") {
            transform = initializeWithLatestValueOrTransform;
        } else {
            initializeWithLatestValue = initializeWithLatestValueOrTransform;
        }

        if (topic && ko.isWriteableObservable(this)) {
            //remove any existing subs
            disposeTopicSubscription.call(this, topic, "subscribeTo");

            //if specified, apply a filter function in the subscription
            callback = function(newValue) {
                self(transform ? transform.call(self, newValue) : newValue);
            };

            ////keep a reference to the subscription, so we can unsubscribe, if necessary
            subscription = exports.subscribe(topic, callback);
            this.postboxSubs[topic].subscribeTo = subscription;

            //ensure that we cleanup pointers to subscription on dispose
            existingDispose = subscription.dispose;
            subscription.dispose = function() {
                delete this.postboxSubs[topic].subscribeTo;
                existingDispose.call(subscription);
            }.bind(this);

            if (initializeWithLatestValue) {
                current = exports.topicCache[topic];

                if (current !== undefined) {
                    callback(current.value);
                }
            }
        }

        return this;
    };

    //discontinue receiving updates on a topic
    ko.subscribable.fn.unsubscribeFrom = function(topic) {
        disposeTopicSubscription.call(this, topic, "subscribeTo");

        return this;
    };

    // both subscribe and publish on the same topic
    //   -allows the ability to sync an observable/writeable computed/observableArray between view models
    //   -subscribeTo should really not use a filter function, as it would likely cause infinite recursion
    ko.subscribable.fn.syncWith = function(topic, initializeWithLatestValue, skipInitialOrEqualityComparer, equalityComparer) {
        this.subscribeTo(topic, initializeWithLatestValue).publishOn(topic, skipInitialOrEqualityComparer, equalityComparer);

        return this;
    };

    ko.subscribable.fn.stopSyncingWith = function(topic) {
        this.unsubscribeFrom(topic).stopPublishingOn(topic);

        return this;
    };

    ko.postbox = exports;
}));

/*!
 * Socket.IO v2.1.1
 * (c) 2014-2018 Guillermo Rauch
 * Released under the MIT License.
 */
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define('socketio',[],e):"object"==typeof exports?exports.io=e():t.io=e()}(this,function(){return function(t){function e(n){if(r[n])return r[n].exports;var o=r[n]={exports:{},id:n,loaded:!1};return t[n].call(o.exports,o,o.exports,e),o.loaded=!0,o.exports}var r={};return e.m=t,e.c=r,e.p="",e(0)}([function(t,e,r){"use strict";function n(t,e){"object"===("undefined"==typeof t?"undefined":o(t))&&(e=t,t=void 0),e=e||{};var r,n=i(t),s=n.source,h=n.id,p=n.path,u=c[h]&&p in c[h].nsps,f=e.forceNew||e["force new connection"]||!1===e.multiplex||u;return f?r=a(s,e):(c[h]||(c[h]=a(s,e)),r=c[h]),n.query&&!e.query&&(e.query=n.query),r.socket(n.path,e)}var o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i=r(1),s=r(4),a=r(9);r(3)("socket.io-client");t.exports=e=n;var c=e.managers={};e.protocol=s.protocol,e.connect=n,e.Manager=r(9),e.Socket=r(34)},function(t,e,r){(function(e){"use strict";function n(t,r){var n=t;r=r||e.location,null==t&&(t=r.protocol+"//"+r.host),"string"==typeof t&&("/"===t.charAt(0)&&(t="/"===t.charAt(1)?r.protocol+t:r.host+t),/^(https?|wss?):\/\//.test(t)||(t="undefined"!=typeof r?r.protocol+"//"+t:"https://"+t),n=o(t)),n.port||(/^(http|ws)$/.test(n.protocol)?n.port="80":/^(http|ws)s$/.test(n.protocol)&&(n.port="443")),n.path=n.path||"/";var i=n.host.indexOf(":")!==-1,s=i?"["+n.host+"]":n.host;return n.id=n.protocol+"://"+s+":"+n.port,n.href=n.protocol+"://"+s+(r&&r.port===n.port?"":":"+n.port),n}var o=r(2);r(3)("socket.io-client:url");t.exports=n}).call(e,function(){return this}())},function(t,e){var r=/^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,n=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"];t.exports=function(t){var e=t,o=t.indexOf("["),i=t.indexOf("]");o!=-1&&i!=-1&&(t=t.substring(0,o)+t.substring(o,i).replace(/:/g,";")+t.substring(i,t.length));for(var s=r.exec(t||""),a={},c=14;c--;)a[n[c]]=s[c]||"";return o!=-1&&i!=-1&&(a.source=e,a.host=a.host.substring(1,a.host.length-1).replace(/;/g,":"),a.authority=a.authority.replace("[","").replace("]","").replace(/;/g,":"),a.ipv6uri=!0),a}},function(t,e){"use strict";t.exports=function(){return function(){}}},function(t,e,r){function n(){}function o(t){var r=""+t.type;if(e.BINARY_EVENT!==t.type&&e.BINARY_ACK!==t.type||(r+=t.attachments+"-"),t.nsp&&"/"!==t.nsp&&(r+=t.nsp+","),null!=t.id&&(r+=t.id),null!=t.data){var n=i(t.data);if(n===!1)return m;r+=n}return r}function i(t){try{return JSON.stringify(t)}catch(t){return!1}}function s(t,e){function r(t){var r=l.deconstructPacket(t),n=o(r.packet),i=r.buffers;i.unshift(n),e(i)}l.removeBlobs(t,r)}function a(){this.reconstructor=null}function c(t){var r=0,n={type:Number(t.charAt(0))};if(null==e.types[n.type])return u("unknown packet type "+n.type);if(e.BINARY_EVENT===n.type||e.BINARY_ACK===n.type){for(var o="";"-"!==t.charAt(++r)&&(o+=t.charAt(r),r!=t.length););if(o!=Number(o)||"-"!==t.charAt(r))throw new Error("Illegal attachments");n.attachments=Number(o)}if("/"===t.charAt(r+1))for(n.nsp="";++r;){var i=t.charAt(r);if(","===i)break;if(n.nsp+=i,r===t.length)break}else n.nsp="/";var s=t.charAt(r+1);if(""!==s&&Number(s)==s){for(n.id="";++r;){var i=t.charAt(r);if(null==i||Number(i)!=i){--r;break}if(n.id+=t.charAt(r),r===t.length)break}n.id=Number(n.id)}if(t.charAt(++r)){var a=h(t.substr(r)),c=a!==!1&&(n.type===e.ERROR||d(a));if(!c)return u("invalid payload");n.data=a}return n}function h(t){try{return JSON.parse(t)}catch(t){return!1}}function p(t){this.reconPack=t,this.buffers=[]}function u(t){return{type:e.ERROR,data:"parser error: "+t}}var f=(r(3)("socket.io-parser"),r(5)),l=r(6),d=r(7),y=r(8);e.protocol=4,e.types=["CONNECT","DISCONNECT","EVENT","ACK","ERROR","BINARY_EVENT","BINARY_ACK"],e.CONNECT=0,e.DISCONNECT=1,e.EVENT=2,e.ACK=3,e.ERROR=4,e.BINARY_EVENT=5,e.BINARY_ACK=6,e.Encoder=n,e.Decoder=a;var m=e.ERROR+'"encode error"';n.prototype.encode=function(t,r){if(e.BINARY_EVENT===t.type||e.BINARY_ACK===t.type)s(t,r);else{var n=o(t);r([n])}},f(a.prototype),a.prototype.add=function(t){var r;if("string"==typeof t)r=c(t),e.BINARY_EVENT===r.type||e.BINARY_ACK===r.type?(this.reconstructor=new p(r),0===this.reconstructor.reconPack.attachments&&this.emit("decoded",r)):this.emit("decoded",r);else{if(!y(t)&&!t.base64)throw new Error("Unknown type: "+t);if(!this.reconstructor)throw new Error("got binary data when not reconstructing a packet");r=this.reconstructor.takeBinaryData(t),r&&(this.reconstructor=null,this.emit("decoded",r))}},a.prototype.destroy=function(){this.reconstructor&&this.reconstructor.finishedReconstruction()},p.prototype.takeBinaryData=function(t){if(this.buffers.push(t),this.buffers.length===this.reconPack.attachments){var e=l.reconstructPacket(this.reconPack,this.buffers);return this.finishedReconstruction(),e}return null},p.prototype.finishedReconstruction=function(){this.reconPack=null,this.buffers=[]}},function(t,e,r){function n(t){if(t)return o(t)}function o(t){for(var e in n.prototype)t[e]=n.prototype[e];return t}t.exports=n,n.prototype.on=n.prototype.addEventListener=function(t,e){return this._callbacks=this._callbacks||{},(this._callbacks["$"+t]=this._callbacks["$"+t]||[]).push(e),this},n.prototype.once=function(t,e){function r(){this.off(t,r),e.apply(this,arguments)}return r.fn=e,this.on(t,r),this},n.prototype.off=n.prototype.removeListener=n.prototype.removeAllListeners=n.prototype.removeEventListener=function(t,e){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var r=this._callbacks["$"+t];if(!r)return this;if(1==arguments.length)return delete this._callbacks["$"+t],this;for(var n,o=0;o<r.length;o++)if(n=r[o],n===e||n.fn===e){r.splice(o,1);break}return this},n.prototype.emit=function(t){this._callbacks=this._callbacks||{};var e=[].slice.call(arguments,1),r=this._callbacks["$"+t];if(r){r=r.slice(0);for(var n=0,o=r.length;n<o;++n)r[n].apply(this,e)}return this},n.prototype.listeners=function(t){return this._callbacks=this._callbacks||{},this._callbacks["$"+t]||[]},n.prototype.hasListeners=function(t){return!!this.listeners(t).length}},function(t,e,r){(function(t){function n(t,e){if(!t)return t;if(s(t)){var r={_placeholder:!0,num:e.length};return e.push(t),r}if(i(t)){for(var o=new Array(t.length),a=0;a<t.length;a++)o[a]=n(t[a],e);return o}if("object"==typeof t&&!(t instanceof Date)){var o={};for(var c in t)o[c]=n(t[c],e);return o}return t}function o(t,e){if(!t)return t;if(t&&t._placeholder)return e[t.num];if(i(t))for(var r=0;r<t.length;r++)t[r]=o(t[r],e);else if("object"==typeof t)for(var n in t)t[n]=o(t[n],e);return t}var i=r(7),s=r(8),a=Object.prototype.toString,c="function"==typeof t.Blob||"[object BlobConstructor]"===a.call(t.Blob),h="function"==typeof t.File||"[object FileConstructor]"===a.call(t.File);e.deconstructPacket=function(t){var e=[],r=t.data,o=t;return o.data=n(r,e),o.attachments=e.length,{packet:o,buffers:e}},e.reconstructPacket=function(t,e){return t.data=o(t.data,e),t.attachments=void 0,t},e.removeBlobs=function(t,e){function r(t,a,p){if(!t)return t;if(c&&t instanceof Blob||h&&t instanceof File){n++;var u=new FileReader;u.onload=function(){p?p[a]=this.result:o=this.result,--n||e(o)},u.readAsArrayBuffer(t)}else if(i(t))for(var f=0;f<t.length;f++)r(t[f],f,t);else if("object"==typeof t&&!s(t))for(var l in t)r(t[l],l,t)}var n=0,o=t;r(o),n||e(o)}}).call(e,function(){return this}())},function(t,e){var r={}.toString;t.exports=Array.isArray||function(t){return"[object Array]"==r.call(t)}},function(t,e){(function(e){function r(t){return n&&e.Buffer.isBuffer(t)||o&&(t instanceof e.ArrayBuffer||i(t))}t.exports=r;var n="function"==typeof e.Buffer&&"function"==typeof e.Buffer.isBuffer,o="function"==typeof e.ArrayBuffer,i=function(){return o&&"function"==typeof e.ArrayBuffer.isView?e.ArrayBuffer.isView:function(t){return t.buffer instanceof e.ArrayBuffer}}()}).call(e,function(){return this}())},function(t,e,r){"use strict";function n(t,e){if(!(this instanceof n))return new n(t,e);t&&"object"===("undefined"==typeof t?"undefined":o(t))&&(e=t,t=void 0),e=e||{},e.path=e.path||"/socket.io",this.nsps={},this.subs=[],this.opts=e,this.reconnection(e.reconnection!==!1),this.reconnectionAttempts(e.reconnectionAttempts||1/0),this.reconnectionDelay(e.reconnectionDelay||1e3),this.reconnectionDelayMax(e.reconnectionDelayMax||5e3),this.randomizationFactor(e.randomizationFactor||.5),this.backoff=new f({min:this.reconnectionDelay(),max:this.reconnectionDelayMax(),jitter:this.randomizationFactor()}),this.timeout(null==e.timeout?2e4:e.timeout),this.readyState="closed",this.uri=t,this.connecting=[],this.lastPing=null,this.encoding=!1,this.packetBuffer=[];var r=e.parser||c;this.encoder=new r.Encoder,this.decoder=new r.Decoder,this.autoConnect=e.autoConnect!==!1,this.autoConnect&&this.open()}var o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i=r(10),s=r(34),a=r(5),c=r(4),h=r(36),p=r(37),u=(r(3)("socket.io-client:manager"),r(33)),f=r(38),l=Object.prototype.hasOwnProperty;t.exports=n,n.prototype.emitAll=function(){this.emit.apply(this,arguments);for(var t in this.nsps)l.call(this.nsps,t)&&this.nsps[t].emit.apply(this.nsps[t],arguments)},n.prototype.updateSocketIds=function(){for(var t in this.nsps)l.call(this.nsps,t)&&(this.nsps[t].id=this.generateId(t))},n.prototype.generateId=function(t){return("/"===t?"":t+"#")+this.engine.id},a(n.prototype),n.prototype.reconnection=function(t){return arguments.length?(this._reconnection=!!t,this):this._reconnection},n.prototype.reconnectionAttempts=function(t){return arguments.length?(this._reconnectionAttempts=t,this):this._reconnectionAttempts},n.prototype.reconnectionDelay=function(t){return arguments.length?(this._reconnectionDelay=t,this.backoff&&this.backoff.setMin(t),this):this._reconnectionDelay},n.prototype.randomizationFactor=function(t){return arguments.length?(this._randomizationFactor=t,this.backoff&&this.backoff.setJitter(t),this):this._randomizationFactor},n.prototype.reconnectionDelayMax=function(t){return arguments.length?(this._reconnectionDelayMax=t,this.backoff&&this.backoff.setMax(t),this):this._reconnectionDelayMax},n.prototype.timeout=function(t){return arguments.length?(this._timeout=t,this):this._timeout},n.prototype.maybeReconnectOnOpen=function(){!this.reconnecting&&this._reconnection&&0===this.backoff.attempts&&this.reconnect()},n.prototype.open=n.prototype.connect=function(t,e){if(~this.readyState.indexOf("open"))return this;this.engine=i(this.uri,this.opts);var r=this.engine,n=this;this.readyState="opening",this.skipReconnect=!1;var o=h(r,"open",function(){n.onopen(),t&&t()}),s=h(r,"error",function(e){if(n.cleanup(),n.readyState="closed",n.emitAll("connect_error",e),t){var r=new Error("Connection error");r.data=e,t(r)}else n.maybeReconnectOnOpen()});if(!1!==this._timeout){var a=this._timeout,c=setTimeout(function(){o.destroy(),r.close(),r.emit("error","timeout"),n.emitAll("connect_timeout",a)},a);this.subs.push({destroy:function(){clearTimeout(c)}})}return this.subs.push(o),this.subs.push(s),this},n.prototype.onopen=function(){this.cleanup(),this.readyState="open",this.emit("open");var t=this.engine;this.subs.push(h(t,"data",p(this,"ondata"))),this.subs.push(h(t,"ping",p(this,"onping"))),this.subs.push(h(t,"pong",p(this,"onpong"))),this.subs.push(h(t,"error",p(this,"onerror"))),this.subs.push(h(t,"close",p(this,"onclose"))),this.subs.push(h(this.decoder,"decoded",p(this,"ondecoded")))},n.prototype.onping=function(){this.lastPing=new Date,this.emitAll("ping")},n.prototype.onpong=function(){this.emitAll("pong",new Date-this.lastPing)},n.prototype.ondata=function(t){this.decoder.add(t)},n.prototype.ondecoded=function(t){this.emit("packet",t)},n.prototype.onerror=function(t){this.emitAll("error",t)},n.prototype.socket=function(t,e){function r(){~u(o.connecting,n)||o.connecting.push(n)}var n=this.nsps[t];if(!n){n=new s(this,t,e),this.nsps[t]=n;var o=this;n.on("connecting",r),n.on("connect",function(){n.id=o.generateId(t)}),this.autoConnect&&r()}return n},n.prototype.destroy=function(t){var e=u(this.connecting,t);~e&&this.connecting.splice(e,1),this.connecting.length||this.close()},n.prototype.packet=function(t){var e=this;t.query&&0===t.type&&(t.nsp+="?"+t.query),e.encoding?e.packetBuffer.push(t):(e.encoding=!0,this.encoder.encode(t,function(r){for(var n=0;n<r.length;n++)e.engine.write(r[n],t.options);e.encoding=!1,e.processPacketQueue()}))},n.prototype.processPacketQueue=function(){if(this.packetBuffer.length>0&&!this.encoding){var t=this.packetBuffer.shift();this.packet(t)}},n.prototype.cleanup=function(){for(var t=this.subs.length,e=0;e<t;e++){var r=this.subs.shift();r.destroy()}this.packetBuffer=[],this.encoding=!1,this.lastPing=null,this.decoder.destroy()},n.prototype.close=n.prototype.disconnect=function(){this.skipReconnect=!0,this.reconnecting=!1,"opening"===this.readyState&&this.cleanup(),this.backoff.reset(),this.readyState="closed",this.engine&&this.engine.close()},n.prototype.onclose=function(t){this.cleanup(),this.backoff.reset(),this.readyState="closed",this.emit("close",t),this._reconnection&&!this.skipReconnect&&this.reconnect()},n.prototype.reconnect=function(){if(this.reconnecting||this.skipReconnect)return this;var t=this;if(this.backoff.attempts>=this._reconnectionAttempts)this.backoff.reset(),this.emitAll("reconnect_failed"),this.reconnecting=!1;else{var e=this.backoff.duration();this.reconnecting=!0;var r=setTimeout(function(){t.skipReconnect||(t.emitAll("reconnect_attempt",t.backoff.attempts),t.emitAll("reconnecting",t.backoff.attempts),t.skipReconnect||t.open(function(e){e?(t.reconnecting=!1,t.reconnect(),t.emitAll("reconnect_error",e.data)):t.onreconnect()}))},e);this.subs.push({destroy:function(){clearTimeout(r)}})}},n.prototype.onreconnect=function(){var t=this.backoff.attempts;this.reconnecting=!1,this.backoff.reset(),this.updateSocketIds(),this.emitAll("reconnect",t)}},function(t,e,r){t.exports=r(11),t.exports.parser=r(18)},function(t,e,r){(function(e){function n(t,r){if(!(this instanceof n))return new n(t,r);r=r||{},t&&"object"==typeof t&&(r=t,t=null),t?(t=h(t),r.hostname=t.host,r.secure="https"===t.protocol||"wss"===t.protocol,r.port=t.port,t.query&&(r.query=t.query)):r.host&&(r.hostname=h(r.host).host),this.secure=null!=r.secure?r.secure:e.location&&"https:"===location.protocol,r.hostname&&!r.port&&(r.port=this.secure?"443":"80"),this.agent=r.agent||!1,this.hostname=r.hostname||(e.location?location.hostname:"localhost"),this.port=r.port||(e.location&&location.port?location.port:this.secure?443:80),this.query=r.query||{},"string"==typeof this.query&&(this.query=p.decode(this.query)),this.upgrade=!1!==r.upgrade,this.path=(r.path||"/engine.io").replace(/\/$/,"")+"/",this.forceJSONP=!!r.forceJSONP,this.jsonp=!1!==r.jsonp,this.forceBase64=!!r.forceBase64,this.enablesXDR=!!r.enablesXDR,this.timestampParam=r.timestampParam||"t",this.timestampRequests=r.timestampRequests,this.transports=r.transports||["polling","websocket"],this.transportOptions=r.transportOptions||{},this.readyState="",this.writeBuffer=[],this.prevBufferLen=0,this.policyPort=r.policyPort||843,this.rememberUpgrade=r.rememberUpgrade||!1,this.binaryType=null,this.onlyBinaryUpgrades=r.onlyBinaryUpgrades,this.perMessageDeflate=!1!==r.perMessageDeflate&&(r.perMessageDeflate||{}),!0===this.perMessageDeflate&&(this.perMessageDeflate={}),this.perMessageDeflate&&null==this.perMessageDeflate.threshold&&(this.perMessageDeflate.threshold=1024),this.pfx=r.pfx||null,this.key=r.key||null,this.passphrase=r.passphrase||null,this.cert=r.cert||null,this.ca=r.ca||null,this.ciphers=r.ciphers||null,this.rejectUnauthorized=void 0===r.rejectUnauthorized||r.rejectUnauthorized,this.forceNode=!!r.forceNode;var o="object"==typeof e&&e;o.global===o&&(r.extraHeaders&&Object.keys(r.extraHeaders).length>0&&(this.extraHeaders=r.extraHeaders),r.localAddress&&(this.localAddress=r.localAddress)),this.id=null,this.upgrades=null,this.pingInterval=null,this.pingTimeout=null,this.pingIntervalTimer=null,this.pingTimeoutTimer=null,this.open()}function o(t){var e={};for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r]);return e}var i=r(12),s=r(5),a=(r(3)("engine.io-client:socket"),r(33)),c=r(18),h=r(2),p=r(27);t.exports=n,n.priorWebsocketSuccess=!1,s(n.prototype),n.protocol=c.protocol,n.Socket=n,n.Transport=r(17),n.transports=r(12),n.parser=r(18),n.prototype.createTransport=function(t){var e=o(this.query);e.EIO=c.protocol,e.transport=t;var r=this.transportOptions[t]||{};this.id&&(e.sid=this.id);var n=new i[t]({query:e,socket:this,agent:r.agent||this.agent,hostname:r.hostname||this.hostname,port:r.port||this.port,secure:r.secure||this.secure,path:r.path||this.path,forceJSONP:r.forceJSONP||this.forceJSONP,jsonp:r.jsonp||this.jsonp,forceBase64:r.forceBase64||this.forceBase64,enablesXDR:r.enablesXDR||this.enablesXDR,timestampRequests:r.timestampRequests||this.timestampRequests,timestampParam:r.timestampParam||this.timestampParam,policyPort:r.policyPort||this.policyPort,pfx:r.pfx||this.pfx,key:r.key||this.key,passphrase:r.passphrase||this.passphrase,cert:r.cert||this.cert,ca:r.ca||this.ca,ciphers:r.ciphers||this.ciphers,rejectUnauthorized:r.rejectUnauthorized||this.rejectUnauthorized,perMessageDeflate:r.perMessageDeflate||this.perMessageDeflate,extraHeaders:r.extraHeaders||this.extraHeaders,forceNode:r.forceNode||this.forceNode,localAddress:r.localAddress||this.localAddress,requestTimeout:r.requestTimeout||this.requestTimeout,protocols:r.protocols||void 0});return n},n.prototype.open=function(){var t;if(this.rememberUpgrade&&n.priorWebsocketSuccess&&this.transports.indexOf("websocket")!==-1)t="websocket";else{if(0===this.transports.length){var e=this;return void setTimeout(function(){e.emit("error","No transports available")},0)}t=this.transports[0]}this.readyState="opening";try{t=this.createTransport(t)}catch(t){return this.transports.shift(),void this.open()}t.open(),this.setTransport(t)},n.prototype.setTransport=function(t){var e=this;this.transport&&this.transport.removeAllListeners(),this.transport=t,t.on("drain",function(){e.onDrain()}).on("packet",function(t){e.onPacket(t)}).on("error",function(t){e.onError(t)}).on("close",function(){e.onClose("transport close")})},n.prototype.probe=function(t){function e(){if(u.onlyBinaryUpgrades){var t=!this.supportsBinary&&u.transport.supportsBinary;p=p||t}p||(h.send([{type:"ping",data:"probe"}]),h.once("packet",function(t){if(!p)if("pong"===t.type&&"probe"===t.data){if(u.upgrading=!0,u.emit("upgrading",h),!h)return;n.priorWebsocketSuccess="websocket"===h.name,u.transport.pause(function(){p||"closed"!==u.readyState&&(c(),u.setTransport(h),h.send([{type:"upgrade"}]),u.emit("upgrade",h),h=null,u.upgrading=!1,u.flush())})}else{var e=new Error("probe error");e.transport=h.name,u.emit("upgradeError",e)}}))}function r(){p||(p=!0,c(),h.close(),h=null)}function o(t){var e=new Error("probe error: "+t);e.transport=h.name,r(),u.emit("upgradeError",e)}function i(){o("transport closed")}function s(){o("socket closed")}function a(t){h&&t.name!==h.name&&r()}function c(){h.removeListener("open",e),h.removeListener("error",o),h.removeListener("close",i),u.removeListener("close",s),u.removeListener("upgrading",a)}var h=this.createTransport(t,{probe:1}),p=!1,u=this;n.priorWebsocketSuccess=!1,h.once("open",e),h.once("error",o),h.once("close",i),this.once("close",s),this.once("upgrading",a),h.open()},n.prototype.onOpen=function(){if(this.readyState="open",n.priorWebsocketSuccess="websocket"===this.transport.name,this.emit("open"),this.flush(),"open"===this.readyState&&this.upgrade&&this.transport.pause)for(var t=0,e=this.upgrades.length;t<e;t++)this.probe(this.upgrades[t])},n.prototype.onPacket=function(t){if("opening"===this.readyState||"open"===this.readyState||"closing"===this.readyState)switch(this.emit("packet",t),this.emit("heartbeat"),t.type){case"open":this.onHandshake(JSON.parse(t.data));break;case"pong":this.setPing(),this.emit("pong");break;case"error":var e=new Error("server error");e.code=t.data,this.onError(e);break;case"message":this.emit("data",t.data),this.emit("message",t.data)}},n.prototype.onHandshake=function(t){this.emit("handshake",t),this.id=t.sid,this.transport.query.sid=t.sid,this.upgrades=this.filterUpgrades(t.upgrades),this.pingInterval=t.pingInterval,this.pingTimeout=t.pingTimeout,this.onOpen(),"closed"!==this.readyState&&(this.setPing(),this.removeListener("heartbeat",this.onHeartbeat),this.on("heartbeat",this.onHeartbeat))},n.prototype.onHeartbeat=function(t){clearTimeout(this.pingTimeoutTimer);var e=this;e.pingTimeoutTimer=setTimeout(function(){"closed"!==e.readyState&&e.onClose("ping timeout")},t||e.pingInterval+e.pingTimeout)},n.prototype.setPing=function(){var t=this;clearTimeout(t.pingIntervalTimer),t.pingIntervalTimer=setTimeout(function(){t.ping(),t.onHeartbeat(t.pingTimeout)},t.pingInterval)},n.prototype.ping=function(){var t=this;this.sendPacket("ping",function(){t.emit("ping")})},n.prototype.onDrain=function(){this.writeBuffer.splice(0,this.prevBufferLen),this.prevBufferLen=0,0===this.writeBuffer.length?this.emit("drain"):this.flush()},n.prototype.flush=function(){"closed"!==this.readyState&&this.transport.writable&&!this.upgrading&&this.writeBuffer.length&&(this.transport.send(this.writeBuffer),this.prevBufferLen=this.writeBuffer.length,this.emit("flush"))},n.prototype.write=n.prototype.send=function(t,e,r){return this.sendPacket("message",t,e,r),this},n.prototype.sendPacket=function(t,e,r,n){if("function"==typeof e&&(n=e,e=void 0),"function"==typeof r&&(n=r,r=null),"closing"!==this.readyState&&"closed"!==this.readyState){r=r||{},r.compress=!1!==r.compress;var o={type:t,data:e,options:r};this.emit("packetCreate",o),this.writeBuffer.push(o),n&&this.once("flush",n),this.flush()}},n.prototype.close=function(){function t(){n.onClose("forced close"),n.transport.close()}function e(){n.removeListener("upgrade",e),n.removeListener("upgradeError",e),t()}function r(){n.once("upgrade",e),n.once("upgradeError",e)}if("opening"===this.readyState||"open"===this.readyState){this.readyState="closing";var n=this;this.writeBuffer.length?this.once("drain",function(){this.upgrading?r():t()}):this.upgrading?r():t()}return this},n.prototype.onError=function(t){n.priorWebsocketSuccess=!1,this.emit("error",t),this.onClose("transport error",t)},n.prototype.onClose=function(t,e){if("opening"===this.readyState||"open"===this.readyState||"closing"===this.readyState){var r=this;clearTimeout(this.pingIntervalTimer),clearTimeout(this.pingTimeoutTimer),this.transport.removeAllListeners("close"),this.transport.close(),this.transport.removeAllListeners(),this.readyState="closed",this.id=null,this.emit("close",t,e),r.writeBuffer=[],r.prevBufferLen=0}},n.prototype.filterUpgrades=function(t){for(var e=[],r=0,n=t.length;r<n;r++)~a(this.transports,t[r])&&e.push(t[r]);return e}}).call(e,function(){return this}())},function(t,e,r){(function(t){function n(e){var r,n=!1,a=!1,c=!1!==e.jsonp;if(t.location){var h="https:"===location.protocol,p=location.port;p||(p=h?443:80),n=e.hostname!==location.hostname||p!==e.port,a=e.secure!==h}if(e.xdomain=n,e.xscheme=a,r=new o(e),"open"in r&&!e.forceJSONP)return new i(e);if(!c)throw new Error("JSONP disabled");return new s(e)}var o=r(13),i=r(15),s=r(30),a=r(31);e.polling=n,e.websocket=a}).call(e,function(){return this}())},function(t,e,r){(function(e){var n=r(14);t.exports=function(t){var r=t.xdomain,o=t.xscheme,i=t.enablesXDR;try{if("undefined"!=typeof XMLHttpRequest&&(!r||n))return new XMLHttpRequest}catch(t){}try{if("undefined"!=typeof XDomainRequest&&!o&&i)return new XDomainRequest}catch(t){}if(!r)try{return new(e[["Active"].concat("Object").join("X")])("Microsoft.XMLHTTP")}catch(t){}}}).call(e,function(){return this}())},function(t,e){try{t.exports="undefined"!=typeof XMLHttpRequest&&"withCredentials"in new XMLHttpRequest}catch(e){t.exports=!1}},function(t,e,r){(function(e){function n(){}function o(t){if(c.call(this,t),this.requestTimeout=t.requestTimeout,this.extraHeaders=t.extraHeaders,e.location){var r="https:"===location.protocol,n=location.port;n||(n=r?443:80),this.xd=t.hostname!==e.location.hostname||n!==t.port,this.xs=t.secure!==r}}function i(t){this.method=t.method||"GET",this.uri=t.uri,this.xd=!!t.xd,this.xs=!!t.xs,this.async=!1!==t.async,this.data=void 0!==t.data?t.data:null,this.agent=t.agent,this.isBinary=t.isBinary,this.supportsBinary=t.supportsBinary,this.enablesXDR=t.enablesXDR,this.requestTimeout=t.requestTimeout,this.pfx=t.pfx,this.key=t.key,this.passphrase=t.passphrase,this.cert=t.cert,this.ca=t.ca,this.ciphers=t.ciphers,this.rejectUnauthorized=t.rejectUnauthorized,this.extraHeaders=t.extraHeaders,this.create()}function s(){for(var t in i.requests)i.requests.hasOwnProperty(t)&&i.requests[t].abort()}var a=r(13),c=r(16),h=r(5),p=r(28);r(3)("engine.io-client:polling-xhr");t.exports=o,t.exports.Request=i,p(o,c),o.prototype.supportsBinary=!0,o.prototype.request=function(t){return t=t||{},t.uri=this.uri(),t.xd=this.xd,t.xs=this.xs,t.agent=this.agent||!1,t.supportsBinary=this.supportsBinary,t.enablesXDR=this.enablesXDR,t.pfx=this.pfx,t.key=this.key,t.passphrase=this.passphrase,t.cert=this.cert,t.ca=this.ca,t.ciphers=this.ciphers,t.rejectUnauthorized=this.rejectUnauthorized,t.requestTimeout=this.requestTimeout,t.extraHeaders=this.extraHeaders,new i(t)},o.prototype.doWrite=function(t,e){var r="string"!=typeof t&&void 0!==t,n=this.request({method:"POST",data:t,isBinary:r}),o=this;n.on("success",e),n.on("error",function(t){o.onError("xhr post error",t)}),this.sendXhr=n},o.prototype.doPoll=function(){var t=this.request(),e=this;t.on("data",function(t){e.onData(t)}),t.on("error",function(t){e.onError("xhr poll error",t)}),this.pollXhr=t},h(i.prototype),i.prototype.create=function(){var t={agent:this.agent,xdomain:this.xd,xscheme:this.xs,enablesXDR:this.enablesXDR};t.pfx=this.pfx,t.key=this.key,t.passphrase=this.passphrase,t.cert=this.cert,t.ca=this.ca,t.ciphers=this.ciphers,t.rejectUnauthorized=this.rejectUnauthorized;var r=this.xhr=new a(t),n=this;try{r.open(this.method,this.uri,this.async);try{if(this.extraHeaders){r.setDisableHeaderCheck&&r.setDisableHeaderCheck(!0);for(var o in this.extraHeaders)this.extraHeaders.hasOwnProperty(o)&&r.setRequestHeader(o,this.extraHeaders[o])}}catch(t){}if("POST"===this.method)try{this.isBinary?r.setRequestHeader("Content-type","application/octet-stream"):r.setRequestHeader("Content-type","text/plain;charset=UTF-8")}catch(t){}try{r.setRequestHeader("Accept","*/*")}catch(t){}"withCredentials"in r&&(r.withCredentials=!0),this.requestTimeout&&(r.timeout=this.requestTimeout),this.hasXDR()?(r.onload=function(){n.onLoad()},r.onerror=function(){n.onError(r.responseText)}):r.onreadystatechange=function(){if(2===r.readyState)try{var t=r.getResponseHeader("Content-Type");n.supportsBinary&&"application/octet-stream"===t&&(r.responseType="arraybuffer")}catch(t){}4===r.readyState&&(200===r.status||1223===r.status?n.onLoad():setTimeout(function(){n.onError(r.status)},0))},r.send(this.data)}catch(t){return void setTimeout(function(){n.onError(t)},0)}e.document&&(this.index=i.requestsCount++,i.requests[this.index]=this)},i.prototype.onSuccess=function(){this.emit("success"),this.cleanup()},i.prototype.onData=function(t){this.emit("data",t),this.onSuccess()},i.prototype.onError=function(t){this.emit("error",t),this.cleanup(!0)},i.prototype.cleanup=function(t){if("undefined"!=typeof this.xhr&&null!==this.xhr){if(this.hasXDR()?this.xhr.onload=this.xhr.onerror=n:this.xhr.onreadystatechange=n,t)try{this.xhr.abort()}catch(t){}e.document&&delete i.requests[this.index],this.xhr=null}},i.prototype.onLoad=function(){var t;try{var e;try{e=this.xhr.getResponseHeader("Content-Type")}catch(t){}t="application/octet-stream"===e?this.xhr.response||this.xhr.responseText:this.xhr.responseText}catch(t){this.onError(t)}null!=t&&this.onData(t)},i.prototype.hasXDR=function(){return"undefined"!=typeof e.XDomainRequest&&!this.xs&&this.enablesXDR},i.prototype.abort=function(){this.cleanup()},i.requestsCount=0,i.requests={},e.document&&(e.attachEvent?e.attachEvent("onunload",s):e.addEventListener&&e.addEventListener("beforeunload",s,!1))}).call(e,function(){return this}())},function(t,e,r){function n(t){var e=t&&t.forceBase64;h&&!e||(this.supportsBinary=!1),o.call(this,t)}var o=r(17),i=r(27),s=r(18),a=r(28),c=r(29);r(3)("engine.io-client:polling");t.exports=n;var h=function(){var t=r(13),e=new t({xdomain:!1});return null!=e.responseType}();a(n,o),n.prototype.name="polling",n.prototype.doOpen=function(){this.poll()},n.prototype.pause=function(t){function e(){r.readyState="paused",t()}var r=this;if(this.readyState="pausing",this.polling||!this.writable){var n=0;this.polling&&(n++,this.once("pollComplete",function(){--n||e()})),this.writable||(n++,this.once("drain",function(){--n||e()}))}else e()},n.prototype.poll=function(){this.polling=!0,this.doPoll(),this.emit("poll")},n.prototype.onData=function(t){var e=this,r=function(t,r,n){return"opening"===e.readyState&&e.onOpen(),"close"===t.type?(e.onClose(),!1):void e.onPacket(t)};s.decodePayload(t,this.socket.binaryType,r),"closed"!==this.readyState&&(this.polling=!1,this.emit("pollComplete"),"open"===this.readyState&&this.poll())},n.prototype.doClose=function(){function t(){e.write([{type:"close"}])}var e=this;"open"===this.readyState?t():this.once("open",t)},n.prototype.write=function(t){var e=this;this.writable=!1;var r=function(){e.writable=!0,e.emit("drain")};s.encodePayload(t,this.supportsBinary,function(t){e.doWrite(t,r)})},n.prototype.uri=function(){var t=this.query||{},e=this.secure?"https":"http",r="";!1!==this.timestampRequests&&(t[this.timestampParam]=c()),this.supportsBinary||t.sid||(t.b64=1),t=i.encode(t),this.port&&("https"===e&&443!==Number(this.port)||"http"===e&&80!==Number(this.port))&&(r=":"+this.port),t.length&&(t="?"+t);var n=this.hostname.indexOf(":")!==-1;return e+"://"+(n?"["+this.hostname+"]":this.hostname)+r+this.path+t}},function(t,e,r){function n(t){this.path=t.path,this.hostname=t.hostname,this.port=t.port,this.secure=t.secure,this.query=t.query,this.timestampParam=t.timestampParam,this.timestampRequests=t.timestampRequests,this.readyState="",this.agent=t.agent||!1,this.socket=t.socket,this.enablesXDR=t.enablesXDR,this.pfx=t.pfx,this.key=t.key,this.passphrase=t.passphrase,this.cert=t.cert,this.ca=t.ca,this.ciphers=t.ciphers,this.rejectUnauthorized=t.rejectUnauthorized,this.forceNode=t.forceNode,this.extraHeaders=t.extraHeaders,this.localAddress=t.localAddress}var o=r(18),i=r(5);t.exports=n,i(n.prototype),n.prototype.onError=function(t,e){var r=new Error(t);return r.type="TransportError",r.description=e,this.emit("error",r),this},n.prototype.open=function(){return"closed"!==this.readyState&&""!==this.readyState||(this.readyState="opening",this.doOpen()),this},n.prototype.close=function(){return"opening"!==this.readyState&&"open"!==this.readyState||(this.doClose(),this.onClose()),this},n.prototype.send=function(t){if("open"!==this.readyState)throw new Error("Transport not open");this.write(t)},n.prototype.onOpen=function(){this.readyState="open",this.writable=!0,this.emit("open")},n.prototype.onData=function(t){var e=o.decodePacket(t,this.socket.binaryType);this.onPacket(e)},n.prototype.onPacket=function(t){this.emit("packet",t)},n.prototype.onClose=function(){this.readyState="closed",this.emit("close")}},function(t,e,r){(function(t){function n(t,r){var n="b"+e.packets[t.type]+t.data.data;return r(n)}function o(t,r,n){if(!r)return e.encodeBase64Packet(t,n);
var o=t.data,i=new Uint8Array(o),s=new Uint8Array(1+o.byteLength);s[0]=v[t.type];for(var a=0;a<i.length;a++)s[a+1]=i[a];return n(s.buffer)}function i(t,r,n){if(!r)return e.encodeBase64Packet(t,n);var o=new FileReader;return o.onload=function(){t.data=o.result,e.encodePacket(t,r,!0,n)},o.readAsArrayBuffer(t.data)}function s(t,r,n){if(!r)return e.encodeBase64Packet(t,n);if(g)return i(t,r,n);var o=new Uint8Array(1);o[0]=v[t.type];var s=new w([o.buffer,t.data]);return n(s)}function a(t){try{t=d.decode(t,{strict:!1})}catch(t){return!1}return t}function c(t,e,r){for(var n=new Array(t.length),o=l(t.length,r),i=function(t,r,o){e(r,function(e,r){n[t]=r,o(e,n)})},s=0;s<t.length;s++)i(s,t[s],o)}var h,p=r(19),u=r(20),f=r(21),l=r(22),d=r(23);t&&t.ArrayBuffer&&(h=r(25));var y="undefined"!=typeof navigator&&/Android/i.test(navigator.userAgent),m="undefined"!=typeof navigator&&/PhantomJS/i.test(navigator.userAgent),g=y||m;e.protocol=3;var v=e.packets={open:0,close:1,ping:2,pong:3,message:4,upgrade:5,noop:6},b=p(v),k={type:"error",data:"parser error"},w=r(26);e.encodePacket=function(e,r,i,a){"function"==typeof r&&(a=r,r=!1),"function"==typeof i&&(a=i,i=null);var c=void 0===e.data?void 0:e.data.buffer||e.data;if(t.ArrayBuffer&&c instanceof ArrayBuffer)return o(e,r,a);if(w&&c instanceof t.Blob)return s(e,r,a);if(c&&c.base64)return n(e,a);var h=v[e.type];return void 0!==e.data&&(h+=i?d.encode(String(e.data),{strict:!1}):String(e.data)),a(""+h)},e.encodeBase64Packet=function(r,n){var o="b"+e.packets[r.type];if(w&&r.data instanceof t.Blob){var i=new FileReader;return i.onload=function(){var t=i.result.split(",")[1];n(o+t)},i.readAsDataURL(r.data)}var s;try{s=String.fromCharCode.apply(null,new Uint8Array(r.data))}catch(t){for(var a=new Uint8Array(r.data),c=new Array(a.length),h=0;h<a.length;h++)c[h]=a[h];s=String.fromCharCode.apply(null,c)}return o+=t.btoa(s),n(o)},e.decodePacket=function(t,r,n){if(void 0===t)return k;if("string"==typeof t){if("b"===t.charAt(0))return e.decodeBase64Packet(t.substr(1),r);if(n&&(t=a(t),t===!1))return k;var o=t.charAt(0);return Number(o)==o&&b[o]?t.length>1?{type:b[o],data:t.substring(1)}:{type:b[o]}:k}var i=new Uint8Array(t),o=i[0],s=f(t,1);return w&&"blob"===r&&(s=new w([s])),{type:b[o],data:s}},e.decodeBase64Packet=function(t,e){var r=b[t.charAt(0)];if(!h)return{type:r,data:{base64:!0,data:t.substr(1)}};var n=h.decode(t.substr(1));return"blob"===e&&w&&(n=new w([n])),{type:r,data:n}},e.encodePayload=function(t,r,n){function o(t){return t.length+":"+t}function i(t,n){e.encodePacket(t,!!s&&r,!1,function(t){n(null,o(t))})}"function"==typeof r&&(n=r,r=null);var s=u(t);return r&&s?w&&!g?e.encodePayloadAsBlob(t,n):e.encodePayloadAsArrayBuffer(t,n):t.length?void c(t,i,function(t,e){return n(e.join(""))}):n("0:")},e.decodePayload=function(t,r,n){if("string"!=typeof t)return e.decodePayloadAsBinary(t,r,n);"function"==typeof r&&(n=r,r=null);var o;if(""===t)return n(k,0,1);for(var i,s,a="",c=0,h=t.length;c<h;c++){var p=t.charAt(c);if(":"===p){if(""===a||a!=(i=Number(a)))return n(k,0,1);if(s=t.substr(c+1,i),a!=s.length)return n(k,0,1);if(s.length){if(o=e.decodePacket(s,r,!1),k.type===o.type&&k.data===o.data)return n(k,0,1);var u=n(o,c+i,h);if(!1===u)return}c+=i,a=""}else a+=p}return""!==a?n(k,0,1):void 0},e.encodePayloadAsArrayBuffer=function(t,r){function n(t,r){e.encodePacket(t,!0,!0,function(t){return r(null,t)})}return t.length?void c(t,n,function(t,e){var n=e.reduce(function(t,e){var r;return r="string"==typeof e?e.length:e.byteLength,t+r.toString().length+r+2},0),o=new Uint8Array(n),i=0;return e.forEach(function(t){var e="string"==typeof t,r=t;if(e){for(var n=new Uint8Array(t.length),s=0;s<t.length;s++)n[s]=t.charCodeAt(s);r=n.buffer}e?o[i++]=0:o[i++]=1;for(var a=r.byteLength.toString(),s=0;s<a.length;s++)o[i++]=parseInt(a[s]);o[i++]=255;for(var n=new Uint8Array(r),s=0;s<n.length;s++)o[i++]=n[s]}),r(o.buffer)}):r(new ArrayBuffer(0))},e.encodePayloadAsBlob=function(t,r){function n(t,r){e.encodePacket(t,!0,!0,function(t){var e=new Uint8Array(1);if(e[0]=1,"string"==typeof t){for(var n=new Uint8Array(t.length),o=0;o<t.length;o++)n[o]=t.charCodeAt(o);t=n.buffer,e[0]=0}for(var i=t instanceof ArrayBuffer?t.byteLength:t.size,s=i.toString(),a=new Uint8Array(s.length+1),o=0;o<s.length;o++)a[o]=parseInt(s[o]);if(a[s.length]=255,w){var c=new w([e.buffer,a.buffer,t]);r(null,c)}})}c(t,n,function(t,e){return r(new w(e))})},e.decodePayloadAsBinary=function(t,r,n){"function"==typeof r&&(n=r,r=null);for(var o=t,i=[];o.byteLength>0;){for(var s=new Uint8Array(o),a=0===s[0],c="",h=1;255!==s[h];h++){if(c.length>310)return n(k,0,1);c+=s[h]}o=f(o,2+c.length),c=parseInt(c);var p=f(o,0,c);if(a)try{p=String.fromCharCode.apply(null,new Uint8Array(p))}catch(t){var u=new Uint8Array(p);p="";for(var h=0;h<u.length;h++)p+=String.fromCharCode(u[h])}i.push(p),o=f(o,c)}var l=i.length;i.forEach(function(t,o){n(e.decodePacket(t,r,!0),o,l)})}}).call(e,function(){return this}())},function(t,e){t.exports=Object.keys||function(t){var e=[],r=Object.prototype.hasOwnProperty;for(var n in t)r.call(t,n)&&e.push(n);return e}},function(t,e,r){(function(e){function n(t){if(!t||"object"!=typeof t)return!1;if(o(t)){for(var r=0,i=t.length;r<i;r++)if(n(t[r]))return!0;return!1}if("function"==typeof e.Buffer&&e.Buffer.isBuffer&&e.Buffer.isBuffer(t)||"function"==typeof e.ArrayBuffer&&t instanceof ArrayBuffer||s&&t instanceof Blob||a&&t instanceof File)return!0;if(t.toJSON&&"function"==typeof t.toJSON&&1===arguments.length)return n(t.toJSON(),!0);for(var c in t)if(Object.prototype.hasOwnProperty.call(t,c)&&n(t[c]))return!0;return!1}var o=r(7),i=Object.prototype.toString,s="function"==typeof e.Blob||"[object BlobConstructor]"===i.call(e.Blob),a="function"==typeof e.File||"[object FileConstructor]"===i.call(e.File);t.exports=n}).call(e,function(){return this}())},function(t,e){t.exports=function(t,e,r){var n=t.byteLength;if(e=e||0,r=r||n,t.slice)return t.slice(e,r);if(e<0&&(e+=n),r<0&&(r+=n),r>n&&(r=n),e>=n||e>=r||0===n)return new ArrayBuffer(0);for(var o=new Uint8Array(t),i=new Uint8Array(r-e),s=e,a=0;s<r;s++,a++)i[a]=o[s];return i.buffer}},function(t,e){function r(t,e,r){function o(t,n){if(o.count<=0)throw new Error("after called too many times");--o.count,t?(i=!0,e(t),e=r):0!==o.count||i||e(null,n)}var i=!1;return r=r||n,o.count=t,0===t?e():o}function n(){}t.exports=r},function(t,e,r){var n;(function(t,o){!function(i){function s(t){for(var e,r,n=[],o=0,i=t.length;o<i;)e=t.charCodeAt(o++),e>=55296&&e<=56319&&o<i?(r=t.charCodeAt(o++),56320==(64512&r)?n.push(((1023&e)<<10)+(1023&r)+65536):(n.push(e),o--)):n.push(e);return n}function a(t){for(var e,r=t.length,n=-1,o="";++n<r;)e=t[n],e>65535&&(e-=65536,o+=k(e>>>10&1023|55296),e=56320|1023&e),o+=k(e);return o}function c(t,e){if(t>=55296&&t<=57343){if(e)throw Error("Lone surrogate U+"+t.toString(16).toUpperCase()+" is not a scalar value");return!1}return!0}function h(t,e){return k(t>>e&63|128)}function p(t,e){if(0==(4294967168&t))return k(t);var r="";return 0==(4294965248&t)?r=k(t>>6&31|192):0==(4294901760&t)?(c(t,e)||(t=65533),r=k(t>>12&15|224),r+=h(t,6)):0==(4292870144&t)&&(r=k(t>>18&7|240),r+=h(t,12),r+=h(t,6)),r+=k(63&t|128)}function u(t,e){e=e||{};for(var r,n=!1!==e.strict,o=s(t),i=o.length,a=-1,c="";++a<i;)r=o[a],c+=p(r,n);return c}function f(){if(b>=v)throw Error("Invalid byte index");var t=255&g[b];if(b++,128==(192&t))return 63&t;throw Error("Invalid continuation byte")}function l(t){var e,r,n,o,i;if(b>v)throw Error("Invalid byte index");if(b==v)return!1;if(e=255&g[b],b++,0==(128&e))return e;if(192==(224&e)){if(r=f(),i=(31&e)<<6|r,i>=128)return i;throw Error("Invalid continuation byte")}if(224==(240&e)){if(r=f(),n=f(),i=(15&e)<<12|r<<6|n,i>=2048)return c(i,t)?i:65533;throw Error("Invalid continuation byte")}if(240==(248&e)&&(r=f(),n=f(),o=f(),i=(7&e)<<18|r<<12|n<<6|o,i>=65536&&i<=1114111))return i;throw Error("Invalid UTF-8 detected")}function d(t,e){e=e||{};var r=!1!==e.strict;g=s(t),v=g.length,b=0;for(var n,o=[];(n=l(r))!==!1;)o.push(n);return a(o)}var y="object"==typeof e&&e,m=("object"==typeof t&&t&&t.exports==y&&t,"object"==typeof o&&o);m.global!==m&&m.window!==m||(i=m);var g,v,b,k=String.fromCharCode,w={version:"2.1.2",encode:u,decode:d};n=function(){return w}.call(e,r,e,t),!(void 0!==n&&(t.exports=n))}(this)}).call(e,r(24)(t),function(){return this}())},function(t,e){t.exports=function(t){return t.webpackPolyfill||(t.deprecate=function(){},t.paths=[],t.children=[],t.webpackPolyfill=1),t}},function(t,e){!function(){"use strict";for(var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",r=new Uint8Array(256),n=0;n<t.length;n++)r[t.charCodeAt(n)]=n;e.encode=function(e){var r,n=new Uint8Array(e),o=n.length,i="";for(r=0;r<o;r+=3)i+=t[n[r]>>2],i+=t[(3&n[r])<<4|n[r+1]>>4],i+=t[(15&n[r+1])<<2|n[r+2]>>6],i+=t[63&n[r+2]];return o%3===2?i=i.substring(0,i.length-1)+"=":o%3===1&&(i=i.substring(0,i.length-2)+"=="),i},e.decode=function(t){var e,n,o,i,s,a=.75*t.length,c=t.length,h=0;"="===t[t.length-1]&&(a--,"="===t[t.length-2]&&a--);var p=new ArrayBuffer(a),u=new Uint8Array(p);for(e=0;e<c;e+=4)n=r[t.charCodeAt(e)],o=r[t.charCodeAt(e+1)],i=r[t.charCodeAt(e+2)],s=r[t.charCodeAt(e+3)],u[h++]=n<<2|o>>4,u[h++]=(15&o)<<4|i>>2,u[h++]=(3&i)<<6|63&s;return p}}()},function(t,e){(function(e){function r(t){for(var e=0;e<t.length;e++){var r=t[e];if(r.buffer instanceof ArrayBuffer){var n=r.buffer;if(r.byteLength!==n.byteLength){var o=new Uint8Array(r.byteLength);o.set(new Uint8Array(n,r.byteOffset,r.byteLength)),n=o.buffer}t[e]=n}}}function n(t,e){e=e||{};var n=new i;r(t);for(var o=0;o<t.length;o++)n.append(t[o]);return e.type?n.getBlob(e.type):n.getBlob()}function o(t,e){return r(t),new Blob(t,e||{})}var i=e.BlobBuilder||e.WebKitBlobBuilder||e.MSBlobBuilder||e.MozBlobBuilder,s=function(){try{var t=new Blob(["hi"]);return 2===t.size}catch(t){return!1}}(),a=s&&function(){try{var t=new Blob([new Uint8Array([1,2])]);return 2===t.size}catch(t){return!1}}(),c=i&&i.prototype.append&&i.prototype.getBlob;t.exports=function(){return s?a?e.Blob:o:c?n:void 0}()}).call(e,function(){return this}())},function(t,e){e.encode=function(t){var e="";for(var r in t)t.hasOwnProperty(r)&&(e.length&&(e+="&"),e+=encodeURIComponent(r)+"="+encodeURIComponent(t[r]));return e},e.decode=function(t){for(var e={},r=t.split("&"),n=0,o=r.length;n<o;n++){var i=r[n].split("=");e[decodeURIComponent(i[0])]=decodeURIComponent(i[1])}return e}},function(t,e){t.exports=function(t,e){var r=function(){};r.prototype=e.prototype,t.prototype=new r,t.prototype.constructor=t}},function(t,e){"use strict";function r(t){var e="";do e=s[t%a]+e,t=Math.floor(t/a);while(t>0);return e}function n(t){var e=0;for(p=0;p<t.length;p++)e=e*a+c[t.charAt(p)];return e}function o(){var t=r(+new Date);return t!==i?(h=0,i=t):t+"."+r(h++)}for(var i,s="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(""),a=64,c={},h=0,p=0;p<a;p++)c[s[p]]=p;o.encode=r,o.decode=n,t.exports=o},function(t,e,r){(function(e){function n(){}function o(t){i.call(this,t),this.query=this.query||{},a||(e.___eio||(e.___eio=[]),a=e.___eio),this.index=a.length;var r=this;a.push(function(t){r.onData(t)}),this.query.j=this.index,e.document&&e.addEventListener&&e.addEventListener("beforeunload",function(){r.script&&(r.script.onerror=n)},!1)}var i=r(16),s=r(28);t.exports=o;var a,c=/\n/g,h=/\\n/g;s(o,i),o.prototype.supportsBinary=!1,o.prototype.doClose=function(){this.script&&(this.script.parentNode.removeChild(this.script),this.script=null),this.form&&(this.form.parentNode.removeChild(this.form),this.form=null,this.iframe=null),i.prototype.doClose.call(this)},o.prototype.doPoll=function(){var t=this,e=document.createElement("script");this.script&&(this.script.parentNode.removeChild(this.script),this.script=null),e.async=!0,e.src=this.uri(),e.onerror=function(e){t.onError("jsonp poll error",e)};var r=document.getElementsByTagName("script")[0];r?r.parentNode.insertBefore(e,r):(document.head||document.body).appendChild(e),this.script=e;var n="undefined"!=typeof navigator&&/gecko/i.test(navigator.userAgent);n&&setTimeout(function(){var t=document.createElement("iframe");document.body.appendChild(t),document.body.removeChild(t)},100)},o.prototype.doWrite=function(t,e){function r(){n(),e()}function n(){if(o.iframe)try{o.form.removeChild(o.iframe)}catch(t){o.onError("jsonp polling iframe removal error",t)}try{var t='<iframe src="javascript:0" name="'+o.iframeId+'">';i=document.createElement(t)}catch(t){i=document.createElement("iframe"),i.name=o.iframeId,i.src="javascript:0"}i.id=o.iframeId,o.form.appendChild(i),o.iframe=i}var o=this;if(!this.form){var i,s=document.createElement("form"),a=document.createElement("textarea"),p=this.iframeId="eio_iframe_"+this.index;s.className="socketio",s.style.position="absolute",s.style.top="-1000px",s.style.left="-1000px",s.target=p,s.method="POST",s.setAttribute("accept-charset","utf-8"),a.name="d",s.appendChild(a),document.body.appendChild(s),this.form=s,this.area=a}this.form.action=this.uri(),n(),t=t.replace(h,"\\\n"),this.area.value=t.replace(c,"\\n");try{this.form.submit()}catch(t){}this.iframe.attachEvent?this.iframe.onreadystatechange=function(){"complete"===o.iframe.readyState&&r()}:this.iframe.onload=r}}).call(e,function(){return this}())},function(t,e,r){(function(e){function n(t){var e=t&&t.forceBase64;e&&(this.supportsBinary=!1),this.perMessageDeflate=t.perMessageDeflate,this.usingBrowserWebSocket=p&&!t.forceNode,this.protocols=t.protocols,this.usingBrowserWebSocket||(u=o),i.call(this,t)}var o,i=r(17),s=r(18),a=r(27),c=r(28),h=r(29),p=(r(3)("engine.io-client:websocket"),e.WebSocket||e.MozWebSocket);if("undefined"==typeof window)try{o=r(32)}catch(t){}var u=p;u||"undefined"!=typeof window||(u=o),t.exports=n,c(n,i),n.prototype.name="websocket",n.prototype.supportsBinary=!0,n.prototype.doOpen=function(){if(this.check()){var t=this.uri(),e=this.protocols,r={agent:this.agent,perMessageDeflate:this.perMessageDeflate};r.pfx=this.pfx,r.key=this.key,r.passphrase=this.passphrase,r.cert=this.cert,r.ca=this.ca,r.ciphers=this.ciphers,r.rejectUnauthorized=this.rejectUnauthorized,this.extraHeaders&&(r.headers=this.extraHeaders),this.localAddress&&(r.localAddress=this.localAddress);try{this.ws=this.usingBrowserWebSocket?e?new u(t,e):new u(t):new u(t,e,r)}catch(t){return this.emit("error",t)}void 0===this.ws.binaryType&&(this.supportsBinary=!1),this.ws.supports&&this.ws.supports.binary?(this.supportsBinary=!0,this.ws.binaryType="nodebuffer"):this.ws.binaryType="arraybuffer",this.addEventListeners()}},n.prototype.addEventListeners=function(){var t=this;this.ws.onopen=function(){t.onOpen()},this.ws.onclose=function(){t.onClose()},this.ws.onmessage=function(e){t.onData(e.data)},this.ws.onerror=function(e){t.onError("websocket error",e)}},n.prototype.write=function(t){function r(){n.emit("flush"),setTimeout(function(){n.writable=!0,n.emit("drain")},0)}var n=this;this.writable=!1;for(var o=t.length,i=0,a=o;i<a;i++)!function(t){s.encodePacket(t,n.supportsBinary,function(i){if(!n.usingBrowserWebSocket){var s={};if(t.options&&(s.compress=t.options.compress),n.perMessageDeflate){var a="string"==typeof i?e.Buffer.byteLength(i):i.length;a<n.perMessageDeflate.threshold&&(s.compress=!1)}}try{n.usingBrowserWebSocket?n.ws.send(i):n.ws.send(i,s)}catch(t){}--o||r()})}(t[i])},n.prototype.onClose=function(){i.prototype.onClose.call(this)},n.prototype.doClose=function(){"undefined"!=typeof this.ws&&this.ws.close()},n.prototype.uri=function(){var t=this.query||{},e=this.secure?"wss":"ws",r="";this.port&&("wss"===e&&443!==Number(this.port)||"ws"===e&&80!==Number(this.port))&&(r=":"+this.port),this.timestampRequests&&(t[this.timestampParam]=h()),this.supportsBinary||(t.b64=1),t=a.encode(t),t.length&&(t="?"+t);var n=this.hostname.indexOf(":")!==-1;return e+"://"+(n?"["+this.hostname+"]":this.hostname)+r+this.path+t},n.prototype.check=function(){return!(!u||"__initialize"in u&&this.name===n.prototype.name)}}).call(e,function(){return this}())},function(t,e){},function(t,e){var r=[].indexOf;t.exports=function(t,e){if(r)return t.indexOf(e);for(var n=0;n<t.length;++n)if(t[n]===e)return n;return-1}},function(t,e,r){"use strict";function n(t,e,r){this.io=t,this.nsp=e,this.json=this,this.ids=0,this.acks={},this.receiveBuffer=[],this.sendBuffer=[],this.connected=!1,this.disconnected=!0,this.flags={},r&&r.query&&(this.query=r.query),this.io.autoConnect&&this.open()}var o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i=r(4),s=r(5),a=r(35),c=r(36),h=r(37),p=(r(3)("socket.io-client:socket"),r(27)),u=r(20);t.exports=e=n;var f={connect:1,connect_error:1,connect_timeout:1,connecting:1,disconnect:1,error:1,reconnect:1,reconnect_attempt:1,reconnect_failed:1,reconnect_error:1,reconnecting:1,ping:1,pong:1},l=s.prototype.emit;s(n.prototype),n.prototype.subEvents=function(){if(!this.subs){var t=this.io;this.subs=[c(t,"open",h(this,"onopen")),c(t,"packet",h(this,"onpacket")),c(t,"close",h(this,"onclose"))]}},n.prototype.open=n.prototype.connect=function(){return this.connected?this:(this.subEvents(),this.io.open(),"open"===this.io.readyState&&this.onopen(),this.emit("connecting"),this)},n.prototype.send=function(){var t=a(arguments);return t.unshift("message"),this.emit.apply(this,t),this},n.prototype.emit=function(t){if(f.hasOwnProperty(t))return l.apply(this,arguments),this;var e=a(arguments),r={type:(void 0!==this.flags.binary?this.flags.binary:u(e))?i.BINARY_EVENT:i.EVENT,data:e};return r.options={},r.options.compress=!this.flags||!1!==this.flags.compress,"function"==typeof e[e.length-1]&&(this.acks[this.ids]=e.pop(),r.id=this.ids++),this.connected?this.packet(r):this.sendBuffer.push(r),this.flags={},this},n.prototype.packet=function(t){t.nsp=this.nsp,this.io.packet(t)},n.prototype.onopen=function(){if("/"!==this.nsp)if(this.query){var t="object"===o(this.query)?p.encode(this.query):this.query;this.packet({type:i.CONNECT,query:t})}else this.packet({type:i.CONNECT})},n.prototype.onclose=function(t){this.connected=!1,this.disconnected=!0,delete this.id,this.emit("disconnect",t)},n.prototype.onpacket=function(t){var e=t.nsp===this.nsp,r=t.type===i.ERROR&&"/"===t.nsp;if(e||r)switch(t.type){case i.CONNECT:this.onconnect();break;case i.EVENT:this.onevent(t);break;case i.BINARY_EVENT:this.onevent(t);break;case i.ACK:this.onack(t);break;case i.BINARY_ACK:this.onack(t);break;case i.DISCONNECT:this.ondisconnect();break;case i.ERROR:this.emit("error",t.data)}},n.prototype.onevent=function(t){var e=t.data||[];null!=t.id&&e.push(this.ack(t.id)),this.connected?l.apply(this,e):this.receiveBuffer.push(e)},n.prototype.ack=function(t){var e=this,r=!1;return function(){if(!r){r=!0;var n=a(arguments);e.packet({type:u(n)?i.BINARY_ACK:i.ACK,id:t,data:n})}}},n.prototype.onack=function(t){var e=this.acks[t.id];"function"==typeof e&&(e.apply(this,t.data),delete this.acks[t.id])},n.prototype.onconnect=function(){this.connected=!0,this.disconnected=!1,this.emit("connect"),this.emitBuffered()},n.prototype.emitBuffered=function(){var t;for(t=0;t<this.receiveBuffer.length;t++)l.apply(this,this.receiveBuffer[t]);for(this.receiveBuffer=[],t=0;t<this.sendBuffer.length;t++)this.packet(this.sendBuffer[t]);this.sendBuffer=[]},n.prototype.ondisconnect=function(){this.destroy(),this.onclose("io server disconnect")},n.prototype.destroy=function(){if(this.subs){for(var t=0;t<this.subs.length;t++)this.subs[t].destroy();this.subs=null}this.io.destroy(this)},n.prototype.close=n.prototype.disconnect=function(){return this.connected&&this.packet({type:i.DISCONNECT}),this.destroy(),this.connected&&this.onclose("io client disconnect"),this},n.prototype.compress=function(t){return this.flags.compress=t,this},n.prototype.binary=function(t){return this.flags.binary=t,this}},function(t,e){function r(t,e){var r=[];e=e||0;for(var n=e||0;n<t.length;n++)r[n-e]=t[n];return r}t.exports=r},function(t,e){"use strict";function r(t,e,r){return t.on(e,r),{destroy:function(){t.removeListener(e,r)}}}t.exports=r},function(t,e){var r=[].slice;t.exports=function(t,e){if("string"==typeof e&&(e=t[e]),"function"!=typeof e)throw new Error("bind() requires a function");var n=r.call(arguments,2);return function(){return e.apply(t,n.concat(r.call(arguments)))}}},function(t,e){function r(t){t=t||{},this.ms=t.min||100,this.max=t.max||1e4,this.factor=t.factor||2,this.jitter=t.jitter>0&&t.jitter<=1?t.jitter:0,this.attempts=0}t.exports=r,r.prototype.duration=function(){var t=this.ms*Math.pow(this.factor,this.attempts++);if(this.jitter){var e=Math.random(),r=Math.floor(e*this.jitter*t);t=0==(1&Math.floor(10*e))?t-r:t+r}return 0|Math.min(t,this.max)},r.prototype.reset=function(){this.attempts=0},r.prototype.setMin=function(t){this.ms=t},r.prototype.setMax=function(t){this.max=t},r.prototype.setJitter=function(t){this.jitter=t}}])});
//# sourceMappingURL=socket.io.slim.js.map;
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define('adapter',[],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.adapter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */


var SDPUtils = require('sdp');

function fixStatsType(stat) {
  return {
    inboundrtp: 'inbound-rtp',
    outboundrtp: 'outbound-rtp',
    candidatepair: 'candidate-pair',
    localcandidate: 'local-candidate',
    remotecandidate: 'remote-candidate'
  }[stat.type] || stat.type;
}

function writeMediaSection(transceiver, caps, type, stream, dtlsRole) {
  var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);

  // Map ICE parameters (ufrag, pwd) to SDP.
  sdp += SDPUtils.writeIceParameters(
      transceiver.iceGatherer.getLocalParameters());

  // Map DTLS parameters to SDP.
  sdp += SDPUtils.writeDtlsParameters(
      transceiver.dtlsTransport.getLocalParameters(),
      type === 'offer' ? 'actpass' : dtlsRole || 'active');

  sdp += 'a=mid:' + transceiver.mid + '\r\n';

  if (transceiver.rtpSender && transceiver.rtpReceiver) {
    sdp += 'a=sendrecv\r\n';
  } else if (transceiver.rtpSender) {
    sdp += 'a=sendonly\r\n';
  } else if (transceiver.rtpReceiver) {
    sdp += 'a=recvonly\r\n';
  } else {
    sdp += 'a=inactive\r\n';
  }

  if (transceiver.rtpSender) {
    var trackId = transceiver.rtpSender._initialTrackId ||
        transceiver.rtpSender.track.id;
    transceiver.rtpSender._initialTrackId = trackId;
    // spec.
    var msid = 'msid:' + (stream ? stream.id : '-') + ' ' +
        trackId + '\r\n';
    sdp += 'a=' + msid;
    // for Chrome. Legacy should no longer be required.
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
        ' ' + msid;

    // RTX
    if (transceiver.sendEncodingParameters[0].rtx) {
      sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
          ' ' + msid;
      sdp += 'a=ssrc-group:FID ' +
          transceiver.sendEncodingParameters[0].ssrc + ' ' +
          transceiver.sendEncodingParameters[0].rtx.ssrc +
          '\r\n';
    }
  }
  // FIXME: this should be written by writeRtpDescription.
  sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
      ' cname:' + SDPUtils.localCName + '\r\n';
  if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
        ' cname:' + SDPUtils.localCName + '\r\n';
  }
  return sdp;
}

// Edge does not like
// 1) stun: filtered after 14393 unless ?transport=udp is present
// 2) turn: that does not have all of turn:host:port?transport=udp
// 3) turn: with ipv6 addresses
// 4) turn: occurring muliple times
function filterIceServers(iceServers, edgeVersion) {
  var hasTurn = false;
  iceServers = JSON.parse(JSON.stringify(iceServers));
  return iceServers.filter(function(server) {
    if (server && (server.urls || server.url)) {
      var urls = server.urls || server.url;
      if (server.url && !server.urls) {
        console.warn('RTCIceServer.url is deprecated! Use urls instead.');
      }
      var isString = typeof urls === 'string';
      if (isString) {
        urls = [urls];
      }
      urls = urls.filter(function(url) {
        var validTurn = url.indexOf('turn:') === 0 &&
            url.indexOf('transport=udp') !== -1 &&
            url.indexOf('turn:[') === -1 &&
            !hasTurn;

        if (validTurn) {
          hasTurn = true;
          return true;
        }
        return url.indexOf('stun:') === 0 && edgeVersion >= 14393 &&
            url.indexOf('?transport=udp') === -1;
      });

      delete server.url;
      server.urls = isString ? urls[0] : urls;
      return !!urls.length;
    }
  });
}

// Determines the intersection of local and remote capabilities.
function getCommonCapabilities(localCapabilities, remoteCapabilities) {
  var commonCapabilities = {
    codecs: [],
    headerExtensions: [],
    fecMechanisms: []
  };

  var findCodecByPayloadType = function(pt, codecs) {
    pt = parseInt(pt, 10);
    for (var i = 0; i < codecs.length; i++) {
      if (codecs[i].payloadType === pt ||
          codecs[i].preferredPayloadType === pt) {
        return codecs[i];
      }
    }
  };

  var rtxCapabilityMatches = function(lRtx, rRtx, lCodecs, rCodecs) {
    var lCodec = findCodecByPayloadType(lRtx.parameters.apt, lCodecs);
    var rCodec = findCodecByPayloadType(rRtx.parameters.apt, rCodecs);
    return lCodec && rCodec &&
        lCodec.name.toLowerCase() === rCodec.name.toLowerCase();
  };

  localCapabilities.codecs.forEach(function(lCodec) {
    for (var i = 0; i < remoteCapabilities.codecs.length; i++) {
      var rCodec = remoteCapabilities.codecs[i];
      if (lCodec.name.toLowerCase() === rCodec.name.toLowerCase() &&
          lCodec.clockRate === rCodec.clockRate) {
        if (lCodec.name.toLowerCase() === 'rtx' &&
            lCodec.parameters && rCodec.parameters.apt) {
          // for RTX we need to find the local rtx that has a apt
          // which points to the same local codec as the remote one.
          if (!rtxCapabilityMatches(lCodec, rCodec,
              localCapabilities.codecs, remoteCapabilities.codecs)) {
            continue;
          }
        }
        rCodec = JSON.parse(JSON.stringify(rCodec)); // deepcopy
        // number of channels is the highest common number of channels
        rCodec.numChannels = Math.min(lCodec.numChannels,
            rCodec.numChannels);
        // push rCodec so we reply with offerer payload type
        commonCapabilities.codecs.push(rCodec);

        // determine common feedback mechanisms
        rCodec.rtcpFeedback = rCodec.rtcpFeedback.filter(function(fb) {
          for (var j = 0; j < lCodec.rtcpFeedback.length; j++) {
            if (lCodec.rtcpFeedback[j].type === fb.type &&
                lCodec.rtcpFeedback[j].parameter === fb.parameter) {
              return true;
            }
          }
          return false;
        });
        // FIXME: also need to determine .parameters
        //  see https://github.com/openpeer/ortc/issues/569
        break;
      }
    }
  });

  localCapabilities.headerExtensions.forEach(function(lHeaderExtension) {
    for (var i = 0; i < remoteCapabilities.headerExtensions.length;
         i++) {
      var rHeaderExtension = remoteCapabilities.headerExtensions[i];
      if (lHeaderExtension.uri === rHeaderExtension.uri) {
        commonCapabilities.headerExtensions.push(rHeaderExtension);
        break;
      }
    }
  });

  // FIXME: fecMechanisms
  return commonCapabilities;
}

// is action=setLocalDescription with type allowed in signalingState
function isActionAllowedInSignalingState(action, type, signalingState) {
  return {
    offer: {
      setLocalDescription: ['stable', 'have-local-offer'],
      setRemoteDescription: ['stable', 'have-remote-offer']
    },
    answer: {
      setLocalDescription: ['have-remote-offer', 'have-local-pranswer'],
      setRemoteDescription: ['have-local-offer', 'have-remote-pranswer']
    }
  }[type][action].indexOf(signalingState) !== -1;
}

function maybeAddCandidate(iceTransport, candidate) {
  // Edge's internal representation adds some fields therefore
  // not all fieldѕ are taken into account.
  var alreadyAdded = iceTransport.getRemoteCandidates()
      .find(function(remoteCandidate) {
        return candidate.foundation === remoteCandidate.foundation &&
            candidate.ip === remoteCandidate.ip &&
            candidate.port === remoteCandidate.port &&
            candidate.priority === remoteCandidate.priority &&
            candidate.protocol === remoteCandidate.protocol &&
            candidate.type === remoteCandidate.type;
      });
  if (!alreadyAdded) {
    iceTransport.addRemoteCandidate(candidate);
  }
  return !alreadyAdded;
}


function makeError(name, description) {
  var e = new Error(description);
  e.name = name;
  // legacy error codes from https://heycam.github.io/webidl/#idl-DOMException-error-names
  e.code = {
    NotSupportedError: 9,
    InvalidStateError: 11,
    InvalidAccessError: 15,
    TypeError: undefined,
    OperationError: undefined
  }[name];
  return e;
}

module.exports = function(window, edgeVersion) {
  // https://w3c.github.io/mediacapture-main/#mediastream
  // Helper function to add the track to the stream and
  // dispatch the event ourselves.
  function addTrackToStreamAndFireEvent(track, stream) {
    stream.addTrack(track);
    stream.dispatchEvent(new window.MediaStreamTrackEvent('addtrack',
        {track: track}));
  }

  function removeTrackFromStreamAndFireEvent(track, stream) {
    stream.removeTrack(track);
    stream.dispatchEvent(new window.MediaStreamTrackEvent('removetrack',
        {track: track}));
  }

  function fireAddTrack(pc, track, receiver, streams) {
    var trackEvent = new Event('track');
    trackEvent.track = track;
    trackEvent.receiver = receiver;
    trackEvent.transceiver = {receiver: receiver};
    trackEvent.streams = streams;
    window.setTimeout(function() {
      pc._dispatchEvent('track', trackEvent);
    });
  }

  var RTCPeerConnection = function(config) {
    var pc = this;

    var _eventTarget = document.createDocumentFragment();
    ['addEventListener', 'removeEventListener', 'dispatchEvent']
        .forEach(function(method) {
          pc[method] = _eventTarget[method].bind(_eventTarget);
        });

    this.canTrickleIceCandidates = null;

    this.needNegotiation = false;

    this.localStreams = [];
    this.remoteStreams = [];

    this._localDescription = null;
    this._remoteDescription = null;

    this.signalingState = 'stable';
    this.iceConnectionState = 'new';
    this.connectionState = 'new';
    this.iceGatheringState = 'new';

    config = JSON.parse(JSON.stringify(config || {}));

    this.usingBundle = config.bundlePolicy === 'max-bundle';
    if (config.rtcpMuxPolicy === 'negotiate') {
      throw(makeError('NotSupportedError',
          'rtcpMuxPolicy \'negotiate\' is not supported'));
    } else if (!config.rtcpMuxPolicy) {
      config.rtcpMuxPolicy = 'require';
    }

    switch (config.iceTransportPolicy) {
      case 'all':
      case 'relay':
        break;
      default:
        config.iceTransportPolicy = 'all';
        break;
    }

    switch (config.bundlePolicy) {
      case 'balanced':
      case 'max-compat':
      case 'max-bundle':
        break;
      default:
        config.bundlePolicy = 'balanced';
        break;
    }

    config.iceServers = filterIceServers(config.iceServers || [], edgeVersion);

    this._iceGatherers = [];
    if (config.iceCandidatePoolSize) {
      for (var i = config.iceCandidatePoolSize; i > 0; i--) {
        this._iceGatherers.push(new window.RTCIceGatherer({
          iceServers: config.iceServers,
          gatherPolicy: config.iceTransportPolicy
        }));
      }
    } else {
      config.iceCandidatePoolSize = 0;
    }

    this._config = config;

    // per-track iceGathers, iceTransports, dtlsTransports, rtpSenders, ...
    // everything that is needed to describe a SDP m-line.
    this.transceivers = [];

    this._sdpSessionId = SDPUtils.generateSessionId();
    this._sdpSessionVersion = 0;

    this._dtlsRole = undefined; // role for a=setup to use in answers.

    this._isClosed = false;
  };

  Object.defineProperty(RTCPeerConnection.prototype, 'localDescription', {
    configurable: true,
    get: function() {
      return this._localDescription;
    }
  });
  Object.defineProperty(RTCPeerConnection.prototype, 'remoteDescription', {
    configurable: true,
    get: function() {
      return this._remoteDescription;
    }
  });

  // set up event handlers on prototype
  RTCPeerConnection.prototype.onicecandidate = null;
  RTCPeerConnection.prototype.onaddstream = null;
  RTCPeerConnection.prototype.ontrack = null;
  RTCPeerConnection.prototype.onremovestream = null;
  RTCPeerConnection.prototype.onsignalingstatechange = null;
  RTCPeerConnection.prototype.oniceconnectionstatechange = null;
  RTCPeerConnection.prototype.onconnectionstatechange = null;
  RTCPeerConnection.prototype.onicegatheringstatechange = null;
  RTCPeerConnection.prototype.onnegotiationneeded = null;
  RTCPeerConnection.prototype.ondatachannel = null;

  RTCPeerConnection.prototype._dispatchEvent = function(name, event) {
    if (this._isClosed) {
      return;
    }
    this.dispatchEvent(event);
    if (typeof this['on' + name] === 'function') {
      this['on' + name](event);
    }
  };

  RTCPeerConnection.prototype._emitGatheringStateChange = function() {
    var event = new Event('icegatheringstatechange');
    this._dispatchEvent('icegatheringstatechange', event);
  };

  RTCPeerConnection.prototype.getConfiguration = function() {
    return this._config;
  };

  RTCPeerConnection.prototype.getLocalStreams = function() {
    return this.localStreams;
  };

  RTCPeerConnection.prototype.getRemoteStreams = function() {
    return this.remoteStreams;
  };

  // internal helper to create a transceiver object.
  // (which is not yet the same as the WebRTC 1.0 transceiver)
  RTCPeerConnection.prototype._createTransceiver = function(kind, doNotAdd) {
    var hasBundleTransport = this.transceivers.length > 0;
    var transceiver = {
      track: null,
      iceGatherer: null,
      iceTransport: null,
      dtlsTransport: null,
      localCapabilities: null,
      remoteCapabilities: null,
      rtpSender: null,
      rtpReceiver: null,
      kind: kind,
      mid: null,
      sendEncodingParameters: null,
      recvEncodingParameters: null,
      stream: null,
      associatedRemoteMediaStreams: [],
      wantReceive: true
    };
    if (this.usingBundle && hasBundleTransport) {
      transceiver.iceTransport = this.transceivers[0].iceTransport;
      transceiver.dtlsTransport = this.transceivers[0].dtlsTransport;
    } else {
      var transports = this._createIceAndDtlsTransports();
      transceiver.iceTransport = transports.iceTransport;
      transceiver.dtlsTransport = transports.dtlsTransport;
    }
    if (!doNotAdd) {
      this.transceivers.push(transceiver);
    }
    return transceiver;
  };

  RTCPeerConnection.prototype.addTrack = function(track, stream) {
    if (this._isClosed) {
      throw makeError('InvalidStateError',
          'Attempted to call addTrack on a closed peerconnection.');
    }

    var alreadyExists = this.transceivers.find(function(s) {
      return s.track === track;
    });

    if (alreadyExists) {
      throw makeError('InvalidAccessError', 'Track already exists.');
    }

    var transceiver;
    for (var i = 0; i < this.transceivers.length; i++) {
      if (!this.transceivers[i].track &&
          this.transceivers[i].kind === track.kind) {
        transceiver = this.transceivers[i];
      }
    }
    if (!transceiver) {
      transceiver = this._createTransceiver(track.kind);
    }

    this._maybeFireNegotiationNeeded();

    if (this.localStreams.indexOf(stream) === -1) {
      this.localStreams.push(stream);
    }

    transceiver.track = track;
    transceiver.stream = stream;
    transceiver.rtpSender = new window.RTCRtpSender(track,
        transceiver.dtlsTransport);
    return transceiver.rtpSender;
  };

  RTCPeerConnection.prototype.addStream = function(stream) {
    var pc = this;
    if (edgeVersion >= 15025) {
      stream.getTracks().forEach(function(track) {
        pc.addTrack(track, stream);
      });
    } else {
      // Clone is necessary for local demos mostly, attaching directly
      // to two different senders does not work (build 10547).
      // Fixed in 15025 (or earlier)
      var clonedStream = stream.clone();
      stream.getTracks().forEach(function(track, idx) {
        var clonedTrack = clonedStream.getTracks()[idx];
        track.addEventListener('enabled', function(event) {
          clonedTrack.enabled = event.enabled;
        });
      });
      clonedStream.getTracks().forEach(function(track) {
        pc.addTrack(track, clonedStream);
      });
    }
  };

  RTCPeerConnection.prototype.removeTrack = function(sender) {
    if (this._isClosed) {
      throw makeError('InvalidStateError',
          'Attempted to call removeTrack on a closed peerconnection.');
    }

    if (!(sender instanceof window.RTCRtpSender)) {
      throw new TypeError('Argument 1 of RTCPeerConnection.removeTrack ' +
          'does not implement interface RTCRtpSender.');
    }

    var transceiver = this.transceivers.find(function(t) {
      return t.rtpSender === sender;
    });

    if (!transceiver) {
      throw makeError('InvalidAccessError',
          'Sender was not created by this connection.');
    }
    var stream = transceiver.stream;

    transceiver.rtpSender.stop();
    transceiver.rtpSender = null;
    transceiver.track = null;
    transceiver.stream = null;

    // remove the stream from the set of local streams
    var localStreams = this.transceivers.map(function(t) {
      return t.stream;
    });
    if (localStreams.indexOf(stream) === -1 &&
        this.localStreams.indexOf(stream) > -1) {
      this.localStreams.splice(this.localStreams.indexOf(stream), 1);
    }

    this._maybeFireNegotiationNeeded();
  };

  RTCPeerConnection.prototype.removeStream = function(stream) {
    var pc = this;
    stream.getTracks().forEach(function(track) {
      var sender = pc.getSenders().find(function(s) {
        return s.track === track;
      });
      if (sender) {
        pc.removeTrack(sender);
      }
    });
  };

  RTCPeerConnection.prototype.getSenders = function() {
    return this.transceivers.filter(function(transceiver) {
      return !!transceiver.rtpSender;
    })
    .map(function(transceiver) {
      return transceiver.rtpSender;
    });
  };

  RTCPeerConnection.prototype.getReceivers = function() {
    return this.transceivers.filter(function(transceiver) {
      return !!transceiver.rtpReceiver;
    })
    .map(function(transceiver) {
      return transceiver.rtpReceiver;
    });
  };


  RTCPeerConnection.prototype._createIceGatherer = function(sdpMLineIndex,
      usingBundle) {
    var pc = this;
    if (usingBundle && sdpMLineIndex > 0) {
      return this.transceivers[0].iceGatherer;
    } else if (this._iceGatherers.length) {
      return this._iceGatherers.shift();
    }
    var iceGatherer = new window.RTCIceGatherer({
      iceServers: this._config.iceServers,
      gatherPolicy: this._config.iceTransportPolicy
    });
    Object.defineProperty(iceGatherer, 'state',
        {value: 'new', writable: true}
    );

    this.transceivers[sdpMLineIndex].bufferedCandidateEvents = [];
    this.transceivers[sdpMLineIndex].bufferCandidates = function(event) {
      var end = !event.candidate || Object.keys(event.candidate).length === 0;
      // polyfill since RTCIceGatherer.state is not implemented in
      // Edge 10547 yet.
      iceGatherer.state = end ? 'completed' : 'gathering';
      if (pc.transceivers[sdpMLineIndex].bufferedCandidateEvents !== null) {
        pc.transceivers[sdpMLineIndex].bufferedCandidateEvents.push(event);
      }
    };
    iceGatherer.addEventListener('localcandidate',
      this.transceivers[sdpMLineIndex].bufferCandidates);
    return iceGatherer;
  };

  // start gathering from an RTCIceGatherer.
  RTCPeerConnection.prototype._gather = function(mid, sdpMLineIndex) {
    var pc = this;
    var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;
    if (iceGatherer.onlocalcandidate) {
      return;
    }
    var bufferedCandidateEvents =
      this.transceivers[sdpMLineIndex].bufferedCandidateEvents;
    this.transceivers[sdpMLineIndex].bufferedCandidateEvents = null;
    iceGatherer.removeEventListener('localcandidate',
      this.transceivers[sdpMLineIndex].bufferCandidates);
    iceGatherer.onlocalcandidate = function(evt) {
      if (pc.usingBundle && sdpMLineIndex > 0) {
        // if we know that we use bundle we can drop candidates with
        // ѕdpMLineIndex > 0. If we don't do this then our state gets
        // confused since we dispose the extra ice gatherer.
        return;
      }
      var event = new Event('icecandidate');
      event.candidate = {sdpMid: mid, sdpMLineIndex: sdpMLineIndex};

      var cand = evt.candidate;
      // Edge emits an empty object for RTCIceCandidateComplete‥
      var end = !cand || Object.keys(cand).length === 0;
      if (end) {
        // polyfill since RTCIceGatherer.state is not implemented in
        // Edge 10547 yet.
        if (iceGatherer.state === 'new' || iceGatherer.state === 'gathering') {
          iceGatherer.state = 'completed';
        }
      } else {
        if (iceGatherer.state === 'new') {
          iceGatherer.state = 'gathering';
        }
        // RTCIceCandidate doesn't have a component, needs to be added
        cand.component = 1;
        // also the usernameFragment. TODO: update SDP to take both variants.
        cand.ufrag = iceGatherer.getLocalParameters().usernameFragment;

        var serializedCandidate = SDPUtils.writeCandidate(cand);
        event.candidate = Object.assign(event.candidate,
            SDPUtils.parseCandidate(serializedCandidate));

        event.candidate.candidate = serializedCandidate;
        event.candidate.toJSON = function() {
          return {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: event.candidate.usernameFragment
          };
        };
      }

      // update local description.
      var sections = SDPUtils.getMediaSections(pc._localDescription.sdp);
      if (!end) {
        sections[event.candidate.sdpMLineIndex] +=
            'a=' + event.candidate.candidate + '\r\n';
      } else {
        sections[event.candidate.sdpMLineIndex] +=
            'a=end-of-candidates\r\n';
      }
      pc._localDescription.sdp =
          SDPUtils.getDescription(pc._localDescription.sdp) +
          sections.join('');
      var complete = pc.transceivers.every(function(transceiver) {
        return transceiver.iceGatherer &&
            transceiver.iceGatherer.state === 'completed';
      });

      if (pc.iceGatheringState !== 'gathering') {
        pc.iceGatheringState = 'gathering';
        pc._emitGatheringStateChange();
      }

      // Emit candidate. Also emit null candidate when all gatherers are
      // complete.
      if (!end) {
        pc._dispatchEvent('icecandidate', event);
      }
      if (complete) {
        pc._dispatchEvent('icecandidate', new Event('icecandidate'));
        pc.iceGatheringState = 'complete';
        pc._emitGatheringStateChange();
      }
    };

    // emit already gathered candidates.
    window.setTimeout(function() {
      bufferedCandidateEvents.forEach(function(e) {
        iceGatherer.onlocalcandidate(e);
      });
    }, 0);
  };

  // Create ICE transport and DTLS transport.
  RTCPeerConnection.prototype._createIceAndDtlsTransports = function() {
    var pc = this;
    var iceTransport = new window.RTCIceTransport(null);
    iceTransport.onicestatechange = function() {
      pc._updateIceConnectionState();
      pc._updateConnectionState();
    };

    var dtlsTransport = new window.RTCDtlsTransport(iceTransport);
    dtlsTransport.ondtlsstatechange = function() {
      pc._updateConnectionState();
    };
    dtlsTransport.onerror = function() {
      // onerror does not set state to failed by itself.
      Object.defineProperty(dtlsTransport, 'state',
          {value: 'failed', writable: true});
      pc._updateConnectionState();
    };

    return {
      iceTransport: iceTransport,
      dtlsTransport: dtlsTransport
    };
  };

  // Destroy ICE gatherer, ICE transport and DTLS transport.
  // Without triggering the callbacks.
  RTCPeerConnection.prototype._disposeIceAndDtlsTransports = function(
      sdpMLineIndex) {
    var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;
    if (iceGatherer) {
      delete iceGatherer.onlocalcandidate;
      delete this.transceivers[sdpMLineIndex].iceGatherer;
    }
    var iceTransport = this.transceivers[sdpMLineIndex].iceTransport;
    if (iceTransport) {
      delete iceTransport.onicestatechange;
      delete this.transceivers[sdpMLineIndex].iceTransport;
    }
    var dtlsTransport = this.transceivers[sdpMLineIndex].dtlsTransport;
    if (dtlsTransport) {
      delete dtlsTransport.ondtlsstatechange;
      delete dtlsTransport.onerror;
      delete this.transceivers[sdpMLineIndex].dtlsTransport;
    }
  };

  // Start the RTP Sender and Receiver for a transceiver.
  RTCPeerConnection.prototype._transceive = function(transceiver,
      send, recv) {
    var params = getCommonCapabilities(transceiver.localCapabilities,
        transceiver.remoteCapabilities);
    if (send && transceiver.rtpSender) {
      params.encodings = transceiver.sendEncodingParameters;
      params.rtcp = {
        cname: SDPUtils.localCName,
        compound: transceiver.rtcpParameters.compound
      };
      if (transceiver.recvEncodingParameters.length) {
        params.rtcp.ssrc = transceiver.recvEncodingParameters[0].ssrc;
      }
      transceiver.rtpSender.send(params);
    }
    if (recv && transceiver.rtpReceiver && params.codecs.length > 0) {
      // remove RTX field in Edge 14942
      if (transceiver.kind === 'video'
          && transceiver.recvEncodingParameters
          && edgeVersion < 15019) {
        transceiver.recvEncodingParameters.forEach(function(p) {
          delete p.rtx;
        });
      }
      if (transceiver.recvEncodingParameters.length) {
        params.encodings = transceiver.recvEncodingParameters;
      } else {
        params.encodings = [{}];
      }
      params.rtcp = {
        compound: transceiver.rtcpParameters.compound
      };
      if (transceiver.rtcpParameters.cname) {
        params.rtcp.cname = transceiver.rtcpParameters.cname;
      }
      if (transceiver.sendEncodingParameters.length) {
        params.rtcp.ssrc = transceiver.sendEncodingParameters[0].ssrc;
      }
      transceiver.rtpReceiver.receive(params);
    }
  };

  RTCPeerConnection.prototype.setLocalDescription = function(description) {
    var pc = this;

    // Note: pranswer is not supported.
    if (['offer', 'answer'].indexOf(description.type) === -1) {
      return Promise.reject(makeError('TypeError',
          'Unsupported type "' + description.type + '"'));
    }

    if (!isActionAllowedInSignalingState('setLocalDescription',
        description.type, pc.signalingState) || pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not set local ' + description.type +
          ' in state ' + pc.signalingState));
    }

    var sections;
    var sessionpart;
    if (description.type === 'offer') {
      // VERY limited support for SDP munging. Limited to:
      // * changing the order of codecs
      sections = SDPUtils.splitSections(description.sdp);
      sessionpart = sections.shift();
      sections.forEach(function(mediaSection, sdpMLineIndex) {
        var caps = SDPUtils.parseRtpParameters(mediaSection);
        pc.transceivers[sdpMLineIndex].localCapabilities = caps;
      });

      pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
        pc._gather(transceiver.mid, sdpMLineIndex);
      });
    } else if (description.type === 'answer') {
      sections = SDPUtils.splitSections(pc._remoteDescription.sdp);
      sessionpart = sections.shift();
      var isIceLite = SDPUtils.matchPrefix(sessionpart,
          'a=ice-lite').length > 0;
      sections.forEach(function(mediaSection, sdpMLineIndex) {
        var transceiver = pc.transceivers[sdpMLineIndex];
        var iceGatherer = transceiver.iceGatherer;
        var iceTransport = transceiver.iceTransport;
        var dtlsTransport = transceiver.dtlsTransport;
        var localCapabilities = transceiver.localCapabilities;
        var remoteCapabilities = transceiver.remoteCapabilities;

        // treat bundle-only as not-rejected.
        var rejected = SDPUtils.isRejected(mediaSection) &&
            SDPUtils.matchPrefix(mediaSection, 'a=bundle-only').length === 0;

        if (!rejected && !transceiver.rejected) {
          var remoteIceParameters = SDPUtils.getIceParameters(
              mediaSection, sessionpart);
          var remoteDtlsParameters = SDPUtils.getDtlsParameters(
              mediaSection, sessionpart);
          if (isIceLite) {
            remoteDtlsParameters.role = 'server';
          }

          if (!pc.usingBundle || sdpMLineIndex === 0) {
            pc._gather(transceiver.mid, sdpMLineIndex);
            if (iceTransport.state === 'new') {
              iceTransport.start(iceGatherer, remoteIceParameters,
                  isIceLite ? 'controlling' : 'controlled');
            }
            if (dtlsTransport.state === 'new') {
              dtlsTransport.start(remoteDtlsParameters);
            }
          }

          // Calculate intersection of capabilities.
          var params = getCommonCapabilities(localCapabilities,
              remoteCapabilities);

          // Start the RTCRtpSender. The RTCRtpReceiver for this
          // transceiver has already been started in setRemoteDescription.
          pc._transceive(transceiver,
              params.codecs.length > 0,
              false);
        }
      });
    }

    pc._localDescription = {
      type: description.type,
      sdp: description.sdp
    };
    if (description.type === 'offer') {
      pc._updateSignalingState('have-local-offer');
    } else {
      pc._updateSignalingState('stable');
    }

    return Promise.resolve();
  };

  RTCPeerConnection.prototype.setRemoteDescription = function(description) {
    var pc = this;

    // Note: pranswer is not supported.
    if (['offer', 'answer'].indexOf(description.type) === -1) {
      return Promise.reject(makeError('TypeError',
          'Unsupported type "' + description.type + '"'));
    }

    if (!isActionAllowedInSignalingState('setRemoteDescription',
        description.type, pc.signalingState) || pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not set remote ' + description.type +
          ' in state ' + pc.signalingState));
    }

    var streams = {};
    pc.remoteStreams.forEach(function(stream) {
      streams[stream.id] = stream;
    });
    var receiverList = [];
    var sections = SDPUtils.splitSections(description.sdp);
    var sessionpart = sections.shift();
    var isIceLite = SDPUtils.matchPrefix(sessionpart,
        'a=ice-lite').length > 0;
    var usingBundle = SDPUtils.matchPrefix(sessionpart,
        'a=group:BUNDLE ').length > 0;
    pc.usingBundle = usingBundle;
    var iceOptions = SDPUtils.matchPrefix(sessionpart,
        'a=ice-options:')[0];
    if (iceOptions) {
      pc.canTrickleIceCandidates = iceOptions.substr(14).split(' ')
          .indexOf('trickle') >= 0;
    } else {
      pc.canTrickleIceCandidates = false;
    }

    sections.forEach(function(mediaSection, sdpMLineIndex) {
      var lines = SDPUtils.splitLines(mediaSection);
      var kind = SDPUtils.getKind(mediaSection);
      // treat bundle-only as not-rejected.
      var rejected = SDPUtils.isRejected(mediaSection) &&
          SDPUtils.matchPrefix(mediaSection, 'a=bundle-only').length === 0;
      var protocol = lines[0].substr(2).split(' ')[2];

      var direction = SDPUtils.getDirection(mediaSection, sessionpart);
      var remoteMsid = SDPUtils.parseMsid(mediaSection);

      var mid = SDPUtils.getMid(mediaSection) || SDPUtils.generateIdentifier();

      // Reject datachannels which are not implemented yet.
      if (rejected || (kind === 'application' && (protocol === 'DTLS/SCTP' ||
          protocol === 'UDP/DTLS/SCTP'))) {
        // TODO: this is dangerous in the case where a non-rejected m-line
        //     becomes rejected.
        pc.transceivers[sdpMLineIndex] = {
          mid: mid,
          kind: kind,
          protocol: protocol,
          rejected: true
        };
        return;
      }

      if (!rejected && pc.transceivers[sdpMLineIndex] &&
          pc.transceivers[sdpMLineIndex].rejected) {
        // recycle a rejected transceiver.
        pc.transceivers[sdpMLineIndex] = pc._createTransceiver(kind, true);
      }

      var transceiver;
      var iceGatherer;
      var iceTransport;
      var dtlsTransport;
      var rtpReceiver;
      var sendEncodingParameters;
      var recvEncodingParameters;
      var localCapabilities;

      var track;
      // FIXME: ensure the mediaSection has rtcp-mux set.
      var remoteCapabilities = SDPUtils.parseRtpParameters(mediaSection);
      var remoteIceParameters;
      var remoteDtlsParameters;
      if (!rejected) {
        remoteIceParameters = SDPUtils.getIceParameters(mediaSection,
            sessionpart);
        remoteDtlsParameters = SDPUtils.getDtlsParameters(mediaSection,
            sessionpart);
        remoteDtlsParameters.role = 'client';
      }
      recvEncodingParameters =
          SDPUtils.parseRtpEncodingParameters(mediaSection);

      var rtcpParameters = SDPUtils.parseRtcpParameters(mediaSection);

      var isComplete = SDPUtils.matchPrefix(mediaSection,
          'a=end-of-candidates', sessionpart).length > 0;
      var cands = SDPUtils.matchPrefix(mediaSection, 'a=candidate:')
          .map(function(cand) {
            return SDPUtils.parseCandidate(cand);
          })
          .filter(function(cand) {
            return cand.component === 1;
          });

      // Check if we can use BUNDLE and dispose transports.
      if ((description.type === 'offer' || description.type === 'answer') &&
          !rejected && usingBundle && sdpMLineIndex > 0 &&
          pc.transceivers[sdpMLineIndex]) {
        pc._disposeIceAndDtlsTransports(sdpMLineIndex);
        pc.transceivers[sdpMLineIndex].iceGatherer =
            pc.transceivers[0].iceGatherer;
        pc.transceivers[sdpMLineIndex].iceTransport =
            pc.transceivers[0].iceTransport;
        pc.transceivers[sdpMLineIndex].dtlsTransport =
            pc.transceivers[0].dtlsTransport;
        if (pc.transceivers[sdpMLineIndex].rtpSender) {
          pc.transceivers[sdpMLineIndex].rtpSender.setTransport(
              pc.transceivers[0].dtlsTransport);
        }
        if (pc.transceivers[sdpMLineIndex].rtpReceiver) {
          pc.transceivers[sdpMLineIndex].rtpReceiver.setTransport(
              pc.transceivers[0].dtlsTransport);
        }
      }
      if (description.type === 'offer' && !rejected) {
        transceiver = pc.transceivers[sdpMLineIndex] ||
            pc._createTransceiver(kind);
        transceiver.mid = mid;

        if (!transceiver.iceGatherer) {
          transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex,
              usingBundle);
        }

        if (cands.length && transceiver.iceTransport.state === 'new') {
          if (isComplete && (!usingBundle || sdpMLineIndex === 0)) {
            transceiver.iceTransport.setRemoteCandidates(cands);
          } else {
            cands.forEach(function(candidate) {
              maybeAddCandidate(transceiver.iceTransport, candidate);
            });
          }
        }

        localCapabilities = window.RTCRtpReceiver.getCapabilities(kind);

        // filter RTX until additional stuff needed for RTX is implemented
        // in adapter.js
        if (edgeVersion < 15019) {
          localCapabilities.codecs = localCapabilities.codecs.filter(
              function(codec) {
                return codec.name !== 'rtx';
              });
        }

        sendEncodingParameters = transceiver.sendEncodingParameters || [{
          ssrc: (2 * sdpMLineIndex + 2) * 1001
        }];

        // TODO: rewrite to use http://w3c.github.io/webrtc-pc/#set-associated-remote-streams
        var isNewTrack = false;
        if (direction === 'sendrecv' || direction === 'sendonly') {
          isNewTrack = !transceiver.rtpReceiver;
          rtpReceiver = transceiver.rtpReceiver ||
              new window.RTCRtpReceiver(transceiver.dtlsTransport, kind);

          if (isNewTrack) {
            var stream;
            track = rtpReceiver.track;
            // FIXME: does not work with Plan B.
            if (remoteMsid && remoteMsid.stream === '-') {
              // no-op. a stream id of '-' means: no associated stream.
            } else if (remoteMsid) {
              if (!streams[remoteMsid.stream]) {
                streams[remoteMsid.stream] = new window.MediaStream();
                Object.defineProperty(streams[remoteMsid.stream], 'id', {
                  get: function() {
                    return remoteMsid.stream;
                  }
                });
              }
              Object.defineProperty(track, 'id', {
                get: function() {
                  return remoteMsid.track;
                }
              });
              stream = streams[remoteMsid.stream];
            } else {
              if (!streams.default) {
                streams.default = new window.MediaStream();
              }
              stream = streams.default;
            }
            if (stream) {
              addTrackToStreamAndFireEvent(track, stream);
              transceiver.associatedRemoteMediaStreams.push(stream);
            }
            receiverList.push([track, rtpReceiver, stream]);
          }
        } else if (transceiver.rtpReceiver && transceiver.rtpReceiver.track) {
          transceiver.associatedRemoteMediaStreams.forEach(function(s) {
            var nativeTrack = s.getTracks().find(function(t) {
              return t.id === transceiver.rtpReceiver.track.id;
            });
            if (nativeTrack) {
              removeTrackFromStreamAndFireEvent(nativeTrack, s);
            }
          });
          transceiver.associatedRemoteMediaStreams = [];
        }

        transceiver.localCapabilities = localCapabilities;
        transceiver.remoteCapabilities = remoteCapabilities;
        transceiver.rtpReceiver = rtpReceiver;
        transceiver.rtcpParameters = rtcpParameters;
        transceiver.sendEncodingParameters = sendEncodingParameters;
        transceiver.recvEncodingParameters = recvEncodingParameters;

        // Start the RTCRtpReceiver now. The RTPSender is started in
        // setLocalDescription.
        pc._transceive(pc.transceivers[sdpMLineIndex],
            false,
            isNewTrack);
      } else if (description.type === 'answer' && !rejected) {
        transceiver = pc.transceivers[sdpMLineIndex];
        iceGatherer = transceiver.iceGatherer;
        iceTransport = transceiver.iceTransport;
        dtlsTransport = transceiver.dtlsTransport;
        rtpReceiver = transceiver.rtpReceiver;
        sendEncodingParameters = transceiver.sendEncodingParameters;
        localCapabilities = transceiver.localCapabilities;

        pc.transceivers[sdpMLineIndex].recvEncodingParameters =
            recvEncodingParameters;
        pc.transceivers[sdpMLineIndex].remoteCapabilities =
            remoteCapabilities;
        pc.transceivers[sdpMLineIndex].rtcpParameters = rtcpParameters;

        if (cands.length && iceTransport.state === 'new') {
          if ((isIceLite || isComplete) &&
              (!usingBundle || sdpMLineIndex === 0)) {
            iceTransport.setRemoteCandidates(cands);
          } else {
            cands.forEach(function(candidate) {
              maybeAddCandidate(transceiver.iceTransport, candidate);
            });
          }
        }

        if (!usingBundle || sdpMLineIndex === 0) {
          if (iceTransport.state === 'new') {
            iceTransport.start(iceGatherer, remoteIceParameters,
                'controlling');
          }
          if (dtlsTransport.state === 'new') {
            dtlsTransport.start(remoteDtlsParameters);
          }
        }

        pc._transceive(transceiver,
            direction === 'sendrecv' || direction === 'recvonly',
            direction === 'sendrecv' || direction === 'sendonly');

        // TODO: rewrite to use http://w3c.github.io/webrtc-pc/#set-associated-remote-streams
        if (rtpReceiver &&
            (direction === 'sendrecv' || direction === 'sendonly')) {
          track = rtpReceiver.track;
          if (remoteMsid) {
            if (!streams[remoteMsid.stream]) {
              streams[remoteMsid.stream] = new window.MediaStream();
            }
            addTrackToStreamAndFireEvent(track, streams[remoteMsid.stream]);
            receiverList.push([track, rtpReceiver, streams[remoteMsid.stream]]);
          } else {
            if (!streams.default) {
              streams.default = new window.MediaStream();
            }
            addTrackToStreamAndFireEvent(track, streams.default);
            receiverList.push([track, rtpReceiver, streams.default]);
          }
        } else {
          // FIXME: actually the receiver should be created later.
          delete transceiver.rtpReceiver;
        }
      }
    });

    if (pc._dtlsRole === undefined) {
      pc._dtlsRole = description.type === 'offer' ? 'active' : 'passive';
    }

    pc._remoteDescription = {
      type: description.type,
      sdp: description.sdp
    };
    if (description.type === 'offer') {
      pc._updateSignalingState('have-remote-offer');
    } else {
      pc._updateSignalingState('stable');
    }
    Object.keys(streams).forEach(function(sid) {
      var stream = streams[sid];
      if (stream.getTracks().length) {
        if (pc.remoteStreams.indexOf(stream) === -1) {
          pc.remoteStreams.push(stream);
          var event = new Event('addstream');
          event.stream = stream;
          window.setTimeout(function() {
            pc._dispatchEvent('addstream', event);
          });
        }

        receiverList.forEach(function(item) {
          var track = item[0];
          var receiver = item[1];
          if (stream.id !== item[2].id) {
            return;
          }
          fireAddTrack(pc, track, receiver, [stream]);
        });
      }
    });
    receiverList.forEach(function(item) {
      if (item[2]) {
        return;
      }
      fireAddTrack(pc, item[0], item[1], []);
    });

    // check whether addIceCandidate({}) was called within four seconds after
    // setRemoteDescription.
    window.setTimeout(function() {
      if (!(pc && pc.transceivers)) {
        return;
      }
      pc.transceivers.forEach(function(transceiver) {
        if (transceiver.iceTransport &&
            transceiver.iceTransport.state === 'new' &&
            transceiver.iceTransport.getRemoteCandidates().length > 0) {
              console.warn('Timeout for addRemoteCandidate. Consider sending ' +
              'an end-of-candidates notification');
          transceiver.iceTransport.addRemoteCandidate({});
        }
      });
    }, 4000);

    return Promise.resolve();
  };

  RTCPeerConnection.prototype.close = function() {
    this.transceivers.forEach(function(transceiver) {
      /* not yet
      if (transceiver.iceGatherer) {
        transceiver.iceGatherer.close();
      }
      */
      if (transceiver.iceTransport) {
        transceiver.iceTransport.stop();
      }
      if (transceiver.dtlsTransport) {
        transceiver.dtlsTransport.stop();
      }
      if (transceiver.rtpSender) {
        transceiver.rtpSender.stop();
      }
      if (transceiver.rtpReceiver) {
        transceiver.rtpReceiver.stop();
      }
    });
    // FIXME: clean up tracks, local streams, remote streams, etc
    this._isClosed = true;
    this._updateSignalingState('closed');
  };

  // Update the signaling state.
  RTCPeerConnection.prototype._updateSignalingState = function(newState) {
    this.signalingState = newState;
    var event = new Event('signalingstatechange');
    this._dispatchEvent('signalingstatechange', event);
  };

  // Determine whether to fire the negotiationneeded event.
  RTCPeerConnection.prototype._maybeFireNegotiationNeeded = function() {
    var pc = this;
    if (this.signalingState !== 'stable' || this.needNegotiation === true) {
      return;
    }
    this.needNegotiation = true;
    window.setTimeout(function() {
      if (pc.needNegotiation) {
        pc.needNegotiation = false;
        var event = new Event('negotiationneeded');
        pc._dispatchEvent('negotiationneeded', event);
      }
    }, 0);
  };

  // Update the ice connection state.
  RTCPeerConnection.prototype._updateIceConnectionState = function() {
    var newState;
    var states = {
      'new': 0,
      closed: 0,
      checking: 0,
      connected: 0,
      completed: 0,
      disconnected: 0,
      failed: 0
    };
    this.transceivers.forEach(function(transceiver) {
      states[transceiver.iceTransport.state]++;
    });

    newState = 'new';
    if (states.failed > 0) {
      newState = 'failed';
    } else if (states.checking > 0) {
      newState = 'checking';
    } else if (states.disconnected > 0) {
      newState = 'disconnected';
    } else if (states.new > 0) {
      newState = 'new';
    } else if (states.connected > 0) {
      newState = 'connected';
    } else if (states.completed > 0) {
      newState = 'completed';
    }

    if (newState !== this.iceConnectionState) {
      this.iceConnectionState = newState;
      var event = new Event('iceconnectionstatechange');
      this._dispatchEvent('iceconnectionstatechange', event);
    }
  };

  // Update the connection state.
  RTCPeerConnection.prototype._updateConnectionState = function() {
    var newState;
    var states = {
      'new': 0,
      closed: 0,
      connecting: 0,
      connected: 0,
      completed: 0,
      disconnected: 0,
      failed: 0
    };
    this.transceivers.forEach(function(transceiver) {
      states[transceiver.iceTransport.state]++;
      states[transceiver.dtlsTransport.state]++;
    });
    // ICETransport.completed and connected are the same for this purpose.
    states.connected += states.completed;

    newState = 'new';
    if (states.failed > 0) {
      newState = 'failed';
    } else if (states.connecting > 0) {
      newState = 'connecting';
    } else if (states.disconnected > 0) {
      newState = 'disconnected';
    } else if (states.new > 0) {
      newState = 'new';
    } else if (states.connected > 0) {
      newState = 'connected';
    }

    if (newState !== this.connectionState) {
      this.connectionState = newState;
      var event = new Event('connectionstatechange');
      this._dispatchEvent('connectionstatechange', event);
    }
  };

  RTCPeerConnection.prototype.createOffer = function() {
    var pc = this;

    if (pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not call createOffer after close'));
    }

    var numAudioTracks = pc.transceivers.filter(function(t) {
      return t.kind === 'audio';
    }).length;
    var numVideoTracks = pc.transceivers.filter(function(t) {
      return t.kind === 'video';
    }).length;

    // Determine number of audio and video tracks we need to send/recv.
    var offerOptions = arguments[0];
    if (offerOptions) {
      // Reject Chrome legacy constraints.
      if (offerOptions.mandatory || offerOptions.optional) {
        throw new TypeError(
            'Legacy mandatory/optional constraints not supported.');
      }
      if (offerOptions.offerToReceiveAudio !== undefined) {
        if (offerOptions.offerToReceiveAudio === true) {
          numAudioTracks = 1;
        } else if (offerOptions.offerToReceiveAudio === false) {
          numAudioTracks = 0;
        } else {
          numAudioTracks = offerOptions.offerToReceiveAudio;
        }
      }
      if (offerOptions.offerToReceiveVideo !== undefined) {
        if (offerOptions.offerToReceiveVideo === true) {
          numVideoTracks = 1;
        } else if (offerOptions.offerToReceiveVideo === false) {
          numVideoTracks = 0;
        } else {
          numVideoTracks = offerOptions.offerToReceiveVideo;
        }
      }
    }

    pc.transceivers.forEach(function(transceiver) {
      if (transceiver.kind === 'audio') {
        numAudioTracks--;
        if (numAudioTracks < 0) {
          transceiver.wantReceive = false;
        }
      } else if (transceiver.kind === 'video') {
        numVideoTracks--;
        if (numVideoTracks < 0) {
          transceiver.wantReceive = false;
        }
      }
    });

    // Create M-lines for recvonly streams.
    while (numAudioTracks > 0 || numVideoTracks > 0) {
      if (numAudioTracks > 0) {
        pc._createTransceiver('audio');
        numAudioTracks--;
      }
      if (numVideoTracks > 0) {
        pc._createTransceiver('video');
        numVideoTracks--;
      }
    }

    var sdp = SDPUtils.writeSessionBoilerplate(pc._sdpSessionId,
        pc._sdpSessionVersion++);
    pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
      // For each track, create an ice gatherer, ice transport,
      // dtls transport, potentially rtpsender and rtpreceiver.
      var track = transceiver.track;
      var kind = transceiver.kind;
      var mid = transceiver.mid || SDPUtils.generateIdentifier();
      transceiver.mid = mid;

      if (!transceiver.iceGatherer) {
        transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex,
            pc.usingBundle);
      }

      var localCapabilities = window.RTCRtpSender.getCapabilities(kind);
      // filter RTX until additional stuff needed for RTX is implemented
      // in adapter.js
      if (edgeVersion < 15019) {
        localCapabilities.codecs = localCapabilities.codecs.filter(
            function(codec) {
              return codec.name !== 'rtx';
            });
      }
      localCapabilities.codecs.forEach(function(codec) {
        // work around https://bugs.chromium.org/p/webrtc/issues/detail?id=6552
        // by adding level-asymmetry-allowed=1
        if (codec.name === 'H264' &&
            codec.parameters['level-asymmetry-allowed'] === undefined) {
          codec.parameters['level-asymmetry-allowed'] = '1';
        }

        // for subsequent offers, we might have to re-use the payload
        // type of the last offer.
        if (transceiver.remoteCapabilities &&
            transceiver.remoteCapabilities.codecs) {
          transceiver.remoteCapabilities.codecs.forEach(function(remoteCodec) {
            if (codec.name.toLowerCase() === remoteCodec.name.toLowerCase() &&
                codec.clockRate === remoteCodec.clockRate) {
              codec.preferredPayloadType = remoteCodec.payloadType;
            }
          });
        }
      });
      localCapabilities.headerExtensions.forEach(function(hdrExt) {
        var remoteExtensions = transceiver.remoteCapabilities &&
            transceiver.remoteCapabilities.headerExtensions || [];
        remoteExtensions.forEach(function(rHdrExt) {
          if (hdrExt.uri === rHdrExt.uri) {
            hdrExt.id = rHdrExt.id;
          }
        });
      });

      // generate an ssrc now, to be used later in rtpSender.send
      var sendEncodingParameters = transceiver.sendEncodingParameters || [{
        ssrc: (2 * sdpMLineIndex + 1) * 1001
      }];
      if (track) {
        // add RTX
        if (edgeVersion >= 15019 && kind === 'video' &&
            !sendEncodingParameters[0].rtx) {
          sendEncodingParameters[0].rtx = {
            ssrc: sendEncodingParameters[0].ssrc + 1
          };
        }
      }

      if (transceiver.wantReceive) {
        transceiver.rtpReceiver = new window.RTCRtpReceiver(
            transceiver.dtlsTransport, kind);
      }

      transceiver.localCapabilities = localCapabilities;
      transceiver.sendEncodingParameters = sendEncodingParameters;
    });

    // always offer BUNDLE and dispose on return if not supported.
    if (pc._config.bundlePolicy !== 'max-compat') {
      sdp += 'a=group:BUNDLE ' + pc.transceivers.map(function(t) {
        return t.mid;
      }).join(' ') + '\r\n';
    }
    sdp += 'a=ice-options:trickle\r\n';

    pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
      sdp += writeMediaSection(transceiver, transceiver.localCapabilities,
          'offer', transceiver.stream, pc._dtlsRole);
      sdp += 'a=rtcp-rsize\r\n';

      if (transceiver.iceGatherer && pc.iceGatheringState !== 'new' &&
          (sdpMLineIndex === 0 || !pc.usingBundle)) {
        transceiver.iceGatherer.getLocalCandidates().forEach(function(cand) {
          cand.component = 1;
          sdp += 'a=' + SDPUtils.writeCandidate(cand) + '\r\n';
        });

        if (transceiver.iceGatherer.state === 'completed') {
          sdp += 'a=end-of-candidates\r\n';
        }
      }
    });

    var desc = new window.RTCSessionDescription({
      type: 'offer',
      sdp: sdp
    });
    return Promise.resolve(desc);
  };

  RTCPeerConnection.prototype.createAnswer = function() {
    var pc = this;

    if (pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not call createAnswer after close'));
    }

    if (!(pc.signalingState === 'have-remote-offer' ||
        pc.signalingState === 'have-local-pranswer')) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not call createAnswer in signalingState ' + pc.signalingState));
    }

    var sdp = SDPUtils.writeSessionBoilerplate(pc._sdpSessionId,
        pc._sdpSessionVersion++);
    if (pc.usingBundle) {
      sdp += 'a=group:BUNDLE ' + pc.transceivers.map(function(t) {
        return t.mid;
      }).join(' ') + '\r\n';
    }
    var mediaSectionsInOffer = SDPUtils.getMediaSections(
        pc._remoteDescription.sdp).length;
    pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
      if (sdpMLineIndex + 1 > mediaSectionsInOffer) {
        return;
      }
      if (transceiver.rejected) {
        if (transceiver.kind === 'application') {
          if (transceiver.protocol === 'DTLS/SCTP') { // legacy fmt
            sdp += 'm=application 0 DTLS/SCTP 5000\r\n';
          } else {
            sdp += 'm=application 0 ' + transceiver.protocol +
                ' webrtc-datachannel\r\n';
          }
        } else if (transceiver.kind === 'audio') {
          sdp += 'm=audio 0 UDP/TLS/RTP/SAVPF 0\r\n' +
              'a=rtpmap:0 PCMU/8000\r\n';
        } else if (transceiver.kind === 'video') {
          sdp += 'm=video 0 UDP/TLS/RTP/SAVPF 120\r\n' +
              'a=rtpmap:120 VP8/90000\r\n';
        }
        sdp += 'c=IN IP4 0.0.0.0\r\n' +
            'a=inactive\r\n' +
            'a=mid:' + transceiver.mid + '\r\n';
        return;
      }

      // FIXME: look at direction.
      if (transceiver.stream) {
        var localTrack;
        if (transceiver.kind === 'audio') {
          localTrack = transceiver.stream.getAudioTracks()[0];
        } else if (transceiver.kind === 'video') {
          localTrack = transceiver.stream.getVideoTracks()[0];
        }
        if (localTrack) {
          // add RTX
          if (edgeVersion >= 15019 && transceiver.kind === 'video' &&
              !transceiver.sendEncodingParameters[0].rtx) {
            transceiver.sendEncodingParameters[0].rtx = {
              ssrc: transceiver.sendEncodingParameters[0].ssrc + 1
            };
          }
        }
      }

      // Calculate intersection of capabilities.
      var commonCapabilities = getCommonCapabilities(
          transceiver.localCapabilities,
          transceiver.remoteCapabilities);

      var hasRtx = commonCapabilities.codecs.filter(function(c) {
        return c.name.toLowerCase() === 'rtx';
      }).length;
      if (!hasRtx && transceiver.sendEncodingParameters[0].rtx) {
        delete transceiver.sendEncodingParameters[0].rtx;
      }

      sdp += writeMediaSection(transceiver, commonCapabilities,
          'answer', transceiver.stream, pc._dtlsRole);
      if (transceiver.rtcpParameters &&
          transceiver.rtcpParameters.reducedSize) {
        sdp += 'a=rtcp-rsize\r\n';
      }
    });

    var desc = new window.RTCSessionDescription({
      type: 'answer',
      sdp: sdp
    });
    return Promise.resolve(desc);
  };

  RTCPeerConnection.prototype.addIceCandidate = function(candidate) {
    var pc = this;
    var sections;
    if (candidate && !(candidate.sdpMLineIndex !== undefined ||
        candidate.sdpMid)) {
      return Promise.reject(new TypeError('sdpMLineIndex or sdpMid required'));
    }

    // TODO: needs to go into ops queue.
    return new Promise(function(resolve, reject) {
      if (!pc._remoteDescription) {
        return reject(makeError('InvalidStateError',
            'Can not add ICE candidate without a remote description'));
      } else if (!candidate || candidate.candidate === '') {
        for (var j = 0; j < pc.transceivers.length; j++) {
          if (pc.transceivers[j].rejected) {
            continue;
          }
          pc.transceivers[j].iceTransport.addRemoteCandidate({});
          sections = SDPUtils.getMediaSections(pc._remoteDescription.sdp);
          sections[j] += 'a=end-of-candidates\r\n';
          pc._remoteDescription.sdp =
              SDPUtils.getDescription(pc._remoteDescription.sdp) +
              sections.join('');
          if (pc.usingBundle) {
            break;
          }
        }
      } else {
        var sdpMLineIndex = candidate.sdpMLineIndex;
        if (candidate.sdpMid) {
          for (var i = 0; i < pc.transceivers.length; i++) {
            if (pc.transceivers[i].mid === candidate.sdpMid) {
              sdpMLineIndex = i;
              break;
            }
          }
        }
        var transceiver = pc.transceivers[sdpMLineIndex];
        if (transceiver) {
          if (transceiver.rejected) {
            return resolve();
          }
          var cand = Object.keys(candidate.candidate).length > 0 ?
              SDPUtils.parseCandidate(candidate.candidate) : {};
          // Ignore Chrome's invalid candidates since Edge does not like them.
          if (cand.protocol === 'tcp' && (cand.port === 0 || cand.port === 9)) {
            return resolve();
          }
          // Ignore RTCP candidates, we assume RTCP-MUX.
          if (cand.component && cand.component !== 1) {
            return resolve();
          }
          // when using bundle, avoid adding candidates to the wrong
          // ice transport. And avoid adding candidates added in the SDP.
          if (sdpMLineIndex === 0 || (sdpMLineIndex > 0 &&
              transceiver.iceTransport !== pc.transceivers[0].iceTransport)) {
            if (!maybeAddCandidate(transceiver.iceTransport, cand)) {
              return reject(makeError('OperationError',
                  'Can not add ICE candidate'));
            }
          }

          // update the remoteDescription.
          var candidateString = candidate.candidate.trim();
          if (candidateString.indexOf('a=') === 0) {
            candidateString = candidateString.substr(2);
          }
          sections = SDPUtils.getMediaSections(pc._remoteDescription.sdp);
          sections[sdpMLineIndex] += 'a=' +
              (cand.type ? candidateString : 'end-of-candidates')
              + '\r\n';
          pc._remoteDescription.sdp =
              SDPUtils.getDescription(pc._remoteDescription.sdp) +
              sections.join('');
        } else {
          return reject(makeError('OperationError',
              'Can not add ICE candidate'));
        }
      }
      resolve();
    });
  };

  RTCPeerConnection.prototype.getStats = function(selector) {
    if (selector && selector instanceof window.MediaStreamTrack) {
      var senderOrReceiver = null;
      this.transceivers.forEach(function(transceiver) {
        if (transceiver.rtpSender &&
            transceiver.rtpSender.track === selector) {
          senderOrReceiver = transceiver.rtpSender;
        } else if (transceiver.rtpReceiver &&
            transceiver.rtpReceiver.track === selector) {
          senderOrReceiver = transceiver.rtpReceiver;
        }
      });
      if (!senderOrReceiver) {
        throw makeError('InvalidAccessError', 'Invalid selector.');
      }
      return senderOrReceiver.getStats();
    }

    var promises = [];
    this.transceivers.forEach(function(transceiver) {
      ['rtpSender', 'rtpReceiver', 'iceGatherer', 'iceTransport',
          'dtlsTransport'].forEach(function(method) {
            if (transceiver[method]) {
              promises.push(transceiver[method].getStats());
            }
          });
    });
    return Promise.all(promises).then(function(allStats) {
      var results = new Map();
      allStats.forEach(function(stats) {
        stats.forEach(function(stat) {
          results.set(stat.id, stat);
        });
      });
      return results;
    });
  };

  // fix low-level stat names and return Map instead of object.
  var ortcObjects = ['RTCRtpSender', 'RTCRtpReceiver', 'RTCIceGatherer',
    'RTCIceTransport', 'RTCDtlsTransport'];
  ortcObjects.forEach(function(ortcObjectName) {
    var obj = window[ortcObjectName];
    if (obj && obj.prototype && obj.prototype.getStats) {
      var nativeGetstats = obj.prototype.getStats;
      obj.prototype.getStats = function() {
        return nativeGetstats.apply(this)
        .then(function(nativeStats) {
          var mapStats = new Map();
          Object.keys(nativeStats).forEach(function(id) {
            nativeStats[id].type = fixStatsType(nativeStats[id]);
            mapStats.set(id, nativeStats[id]);
          });
          return mapStats;
        });
      };
    }
  });

  // legacy callback shims. Should be moved to adapter.js some days.
  var methods = ['createOffer', 'createAnswer'];
  methods.forEach(function(method) {
    var nativeMethod = RTCPeerConnection.prototype[method];
    RTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      if (typeof args[0] === 'function' ||
          typeof args[1] === 'function') { // legacy
        return nativeMethod.apply(this, [arguments[2]])
        .then(function(description) {
          if (typeof args[0] === 'function') {
            args[0].apply(null, [description]);
          }
        }, function(error) {
          if (typeof args[1] === 'function') {
            args[1].apply(null, [error]);
          }
        });
      }
      return nativeMethod.apply(this, arguments);
    };
  });

  methods = ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate'];
  methods.forEach(function(method) {
    var nativeMethod = RTCPeerConnection.prototype[method];
    RTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      if (typeof args[1] === 'function' ||
          typeof args[2] === 'function') { // legacy
        return nativeMethod.apply(this, arguments)
        .then(function() {
          if (typeof args[1] === 'function') {
            args[1].apply(null);
          }
        }, function(error) {
          if (typeof args[2] === 'function') {
            args[2].apply(null, [error]);
          }
        });
      }
      return nativeMethod.apply(this, arguments);
    };
  });

  // getStats is special. It doesn't have a spec legacy method yet we support
  // getStats(something, cb) without error callbacks.
  ['getStats'].forEach(function(method) {
    var nativeMethod = RTCPeerConnection.prototype[method];
    RTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      if (typeof args[1] === 'function') {
        return nativeMethod.apply(this, arguments)
        .then(function() {
          if (typeof args[1] === 'function') {
            args[1].apply(null);
          }
        });
      }
      return nativeMethod.apply(this, arguments);
    };
  });

  return RTCPeerConnection;
};

},{"sdp":2}],2:[function(require,module,exports){
 /* eslint-env node */


// SDP helpers.
var SDPUtils = {};

// Generate an alphanumeric identifier for cname or mids.
// TODO: use UUIDs instead? https://gist.github.com/jed/982883
SDPUtils.generateIdentifier = function() {
  return Math.random().toString(36).substr(2, 10);
};

// The RTCP CNAME used by all peerconnections from the same JS.
SDPUtils.localCName = SDPUtils.generateIdentifier();

// Splits SDP into lines, dealing with both CRLF and LF.
SDPUtils.splitLines = function(blob) {
  return blob.trim().split('\n').map(function(line) {
    return line.trim();
  });
};
// Splits SDP into sessionpart and mediasections. Ensures CRLF.
SDPUtils.splitSections = function(blob) {
  var parts = blob.split('\nm=');
  return parts.map(function(part, index) {
    return (index > 0 ? 'm=' + part : part).trim() + '\r\n';
  });
};

// returns the session description.
SDPUtils.getDescription = function(blob) {
  var sections = SDPUtils.splitSections(blob);
  return sections && sections[0];
};

// returns the individual media sections.
SDPUtils.getMediaSections = function(blob) {
  var sections = SDPUtils.splitSections(blob);
  sections.shift();
  return sections;
};

// Returns lines that start with a certain prefix.
SDPUtils.matchPrefix = function(blob, prefix) {
  return SDPUtils.splitLines(blob).filter(function(line) {
    return line.indexOf(prefix) === 0;
  });
};

// Parses an ICE candidate line. Sample input:
// candidate:702786350 2 udp 41819902 8.8.8.8 60769 typ relay raddr 8.8.8.8
// rport 55996"
SDPUtils.parseCandidate = function(line) {
  var parts;
  // Parse both variants.
  if (line.indexOf('a=candidate:') === 0) {
    parts = line.substring(12).split(' ');
  } else {
    parts = line.substring(10).split(' ');
  }

  var candidate = {
    foundation: parts[0],
    component: parseInt(parts[1], 10),
    protocol: parts[2].toLowerCase(),
    priority: parseInt(parts[3], 10),
    ip: parts[4],
    port: parseInt(parts[5], 10),
    // skip parts[6] == 'typ'
    type: parts[7]
  };

  for (var i = 8; i < parts.length; i += 2) {
    switch (parts[i]) {
      case 'raddr':
        candidate.relatedAddress = parts[i + 1];
        break;
      case 'rport':
        candidate.relatedPort = parseInt(parts[i + 1], 10);
        break;
      case 'tcptype':
        candidate.tcpType = parts[i + 1];
        break;
      case 'ufrag':
        candidate.ufrag = parts[i + 1]; // for backward compability.
        candidate.usernameFragment = parts[i + 1];
        break;
      default: // extension handling, in particular ufrag
        candidate[parts[i]] = parts[i + 1];
        break;
    }
  }
  return candidate;
};

// Translates a candidate object into SDP candidate attribute.
SDPUtils.writeCandidate = function(candidate) {
  var sdp = [];
  sdp.push(candidate.foundation);
  sdp.push(candidate.component);
  sdp.push(candidate.protocol.toUpperCase());
  sdp.push(candidate.priority);
  sdp.push(candidate.ip);
  sdp.push(candidate.port);

  var type = candidate.type;
  sdp.push('typ');
  sdp.push(type);
  if (type !== 'host' && candidate.relatedAddress &&
      candidate.relatedPort) {
    sdp.push('raddr');
    sdp.push(candidate.relatedAddress);
    sdp.push('rport');
    sdp.push(candidate.relatedPort);
  }
  if (candidate.tcpType && candidate.protocol.toLowerCase() === 'tcp') {
    sdp.push('tcptype');
    sdp.push(candidate.tcpType);
  }
  if (candidate.usernameFragment || candidate.ufrag) {
    sdp.push('ufrag');
    sdp.push(candidate.usernameFragment || candidate.ufrag);
  }
  return 'candidate:' + sdp.join(' ');
};

// Parses an ice-options line, returns an array of option tags.
// a=ice-options:foo bar
SDPUtils.parseIceOptions = function(line) {
  return line.substr(14).split(' ');
}

// Parses an rtpmap line, returns RTCRtpCoddecParameters. Sample input:
// a=rtpmap:111 opus/48000/2
SDPUtils.parseRtpMap = function(line) {
  var parts = line.substr(9).split(' ');
  var parsed = {
    payloadType: parseInt(parts.shift(), 10) // was: id
  };

  parts = parts[0].split('/');

  parsed.name = parts[0];
  parsed.clockRate = parseInt(parts[1], 10); // was: clockrate
  parsed.channels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
  // legacy alias, got renamed back to channels in ORTC.
  parsed.numChannels = parsed.channels;
  return parsed;
};

// Generate an a=rtpmap line from RTCRtpCodecCapability or
// RTCRtpCodecParameters.
SDPUtils.writeRtpMap = function(codec) {
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  var channels = codec.channels || codec.numChannels || 1;
  return 'a=rtpmap:' + pt + ' ' + codec.name + '/' + codec.clockRate +
      (channels !== 1 ? '/' + channels : '') + '\r\n';
};

// Parses an a=extmap line (headerextension from RFC 5285). Sample input:
// a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
// a=extmap:2/sendonly urn:ietf:params:rtp-hdrext:toffset
SDPUtils.parseExtmap = function(line) {
  var parts = line.substr(9).split(' ');
  return {
    id: parseInt(parts[0], 10),
    direction: parts[0].indexOf('/') > 0 ? parts[0].split('/')[1] : 'sendrecv',
    uri: parts[1]
  };
};

// Generates a=extmap line from RTCRtpHeaderExtensionParameters or
// RTCRtpHeaderExtension.
SDPUtils.writeExtmap = function(headerExtension) {
  return 'a=extmap:' + (headerExtension.id || headerExtension.preferredId) +
      (headerExtension.direction && headerExtension.direction !== 'sendrecv'
          ? '/' + headerExtension.direction
          : '') +
      ' ' + headerExtension.uri + '\r\n';
};

// Parses an ftmp line, returns dictionary. Sample input:
// a=fmtp:96 vbr=on;cng=on
// Also deals with vbr=on; cng=on
SDPUtils.parseFmtp = function(line) {
  var parsed = {};
  var kv;
  var parts = line.substr(line.indexOf(' ') + 1).split(';');
  for (var j = 0; j < parts.length; j++) {
    kv = parts[j].trim().split('=');
    parsed[kv[0].trim()] = kv[1];
  }
  return parsed;
};

// Generates an a=ftmp line from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeFmtp = function(codec) {
  var line = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.parameters && Object.keys(codec.parameters).length) {
    var params = [];
    Object.keys(codec.parameters).forEach(function(param) {
      if (codec.parameters[param]) {
        params.push(param + '=' + codec.parameters[param]);
      } else {
        params.push(param);
      }
    });
    line += 'a=fmtp:' + pt + ' ' + params.join(';') + '\r\n';
  }
  return line;
};

// Parses an rtcp-fb line, returns RTCPRtcpFeedback object. Sample input:
// a=rtcp-fb:98 nack rpsi
SDPUtils.parseRtcpFb = function(line) {
  var parts = line.substr(line.indexOf(' ') + 1).split(' ');
  return {
    type: parts.shift(),
    parameter: parts.join(' ')
  };
};
// Generate a=rtcp-fb lines from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeRtcpFb = function(codec) {
  var lines = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
    // FIXME: special handling for trr-int?
    codec.rtcpFeedback.forEach(function(fb) {
      lines += 'a=rtcp-fb:' + pt + ' ' + fb.type +
      (fb.parameter && fb.parameter.length ? ' ' + fb.parameter : '') +
          '\r\n';
    });
  }
  return lines;
};

// Parses an RFC 5576 ssrc media attribute. Sample input:
// a=ssrc:3735928559 cname:something
SDPUtils.parseSsrcMedia = function(line) {
  var sp = line.indexOf(' ');
  var parts = {
    ssrc: parseInt(line.substr(7, sp - 7), 10)
  };
  var colon = line.indexOf(':', sp);
  if (colon > -1) {
    parts.attribute = line.substr(sp + 1, colon - sp - 1);
    parts.value = line.substr(colon + 1);
  } else {
    parts.attribute = line.substr(sp + 1);
  }
  return parts;
};

// Extracts the MID (RFC 5888) from a media section.
// returns the MID or undefined if no mid line was found.
SDPUtils.getMid = function(mediaSection) {
  var mid = SDPUtils.matchPrefix(mediaSection, 'a=mid:')[0];
  if (mid) {
    return mid.substr(6);
  }
}

SDPUtils.parseFingerprint = function(line) {
  var parts = line.substr(14).split(' ');
  return {
    algorithm: parts[0].toLowerCase(), // algorithm is case-sensitive in Edge.
    value: parts[1]
  };
};

// Extracts DTLS parameters from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the fingerprint line as input. See also getIceParameters.
SDPUtils.getDtlsParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.matchPrefix(mediaSection + sessionpart,
      'a=fingerprint:');
  // Note: a=setup line is ignored since we use the 'auto' role.
  // Note2: 'algorithm' is not case sensitive except in Edge.
  return {
    role: 'auto',
    fingerprints: lines.map(SDPUtils.parseFingerprint)
  };
};

// Serializes DTLS parameters to SDP.
SDPUtils.writeDtlsParameters = function(params, setupType) {
  var sdp = 'a=setup:' + setupType + '\r\n';
  params.fingerprints.forEach(function(fp) {
    sdp += 'a=fingerprint:' + fp.algorithm + ' ' + fp.value + '\r\n';
  });
  return sdp;
};
// Parses ICE information from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the ice-ufrag and ice-pwd lines as input.
SDPUtils.getIceParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.splitLines(mediaSection);
  // Search in session part, too.
  lines = lines.concat(SDPUtils.splitLines(sessionpart));
  var iceParameters = {
    usernameFragment: lines.filter(function(line) {
      return line.indexOf('a=ice-ufrag:') === 0;
    })[0].substr(12),
    password: lines.filter(function(line) {
      return line.indexOf('a=ice-pwd:') === 0;
    })[0].substr(10)
  };
  return iceParameters;
};

// Serializes ICE parameters to SDP.
SDPUtils.writeIceParameters = function(params) {
  return 'a=ice-ufrag:' + params.usernameFragment + '\r\n' +
      'a=ice-pwd:' + params.password + '\r\n';
};

// Parses the SDP media section and returns RTCRtpParameters.
SDPUtils.parseRtpParameters = function(mediaSection) {
  var description = {
    codecs: [],
    headerExtensions: [],
    fecMechanisms: [],
    rtcp: []
  };
  var lines = SDPUtils.splitLines(mediaSection);
  var mline = lines[0].split(' ');
  for (var i = 3; i < mline.length; i++) { // find all codecs from mline[3..]
    var pt = mline[i];
    var rtpmapline = SDPUtils.matchPrefix(
        mediaSection, 'a=rtpmap:' + pt + ' ')[0];
    if (rtpmapline) {
      var codec = SDPUtils.parseRtpMap(rtpmapline);
      var fmtps = SDPUtils.matchPrefix(
          mediaSection, 'a=fmtp:' + pt + ' ');
      // Only the first a=fmtp:<pt> is considered.
      codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
      codec.rtcpFeedback = SDPUtils.matchPrefix(
          mediaSection, 'a=rtcp-fb:' + pt + ' ')
        .map(SDPUtils.parseRtcpFb);
      description.codecs.push(codec);
      // parse FEC mechanisms from rtpmap lines.
      switch (codec.name.toUpperCase()) {
        case 'RED':
        case 'ULPFEC':
          description.fecMechanisms.push(codec.name.toUpperCase());
          break;
        default: // only RED and ULPFEC are recognized as FEC mechanisms.
          break;
      }
    }
  }
  SDPUtils.matchPrefix(mediaSection, 'a=extmap:').forEach(function(line) {
    description.headerExtensions.push(SDPUtils.parseExtmap(line));
  });
  // FIXME: parse rtcp.
  return description;
};

// Generates parts of the SDP media section describing the capabilities /
// parameters.
SDPUtils.writeRtpDescription = function(kind, caps) {
  var sdp = '';

  // Build the mline.
  sdp += 'm=' + kind + ' ';
  sdp += caps.codecs.length > 0 ? '9' : '0'; // reject if no codecs.
  sdp += ' UDP/TLS/RTP/SAVPF ';
  sdp += caps.codecs.map(function(codec) {
    if (codec.preferredPayloadType !== undefined) {
      return codec.preferredPayloadType;
    }
    return codec.payloadType;
  }).join(' ') + '\r\n';

  sdp += 'c=IN IP4 0.0.0.0\r\n';
  sdp += 'a=rtcp:9 IN IP4 0.0.0.0\r\n';

  // Add a=rtpmap lines for each codec. Also fmtp and rtcp-fb.
  caps.codecs.forEach(function(codec) {
    sdp += SDPUtils.writeRtpMap(codec);
    sdp += SDPUtils.writeFmtp(codec);
    sdp += SDPUtils.writeRtcpFb(codec);
  });
  var maxptime = 0;
  caps.codecs.forEach(function(codec) {
    if (codec.maxptime > maxptime) {
      maxptime = codec.maxptime;
    }
  });
  if (maxptime > 0) {
    sdp += 'a=maxptime:' + maxptime + '\r\n';
  }
  sdp += 'a=rtcp-mux\r\n';

  if (caps.headerExtensions) {
    caps.headerExtensions.forEach(function(extension) {
      sdp += SDPUtils.writeExtmap(extension);
    });
  }
  // FIXME: write fecMechanisms.
  return sdp;
};

// Parses the SDP media section and returns an array of
// RTCRtpEncodingParameters.
SDPUtils.parseRtpEncodingParameters = function(mediaSection) {
  var encodingParameters = [];
  var description = SDPUtils.parseRtpParameters(mediaSection);
  var hasRed = description.fecMechanisms.indexOf('RED') !== -1;
  var hasUlpfec = description.fecMechanisms.indexOf('ULPFEC') !== -1;

  // filter a=ssrc:... cname:, ignore PlanB-msid
  var ssrcs = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
  .map(function(line) {
    return SDPUtils.parseSsrcMedia(line);
  })
  .filter(function(parts) {
    return parts.attribute === 'cname';
  });
  var primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
  var secondarySsrc;

  var flows = SDPUtils.matchPrefix(mediaSection, 'a=ssrc-group:FID')
  .map(function(line) {
    var parts = line.substr(17).split(' ');
    return parts.map(function(part) {
      return parseInt(part, 10);
    });
  });
  if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
    secondarySsrc = flows[0][1];
  }

  description.codecs.forEach(function(codec) {
    if (codec.name.toUpperCase() === 'RTX' && codec.parameters.apt) {
      var encParam = {
        ssrc: primarySsrc,
        codecPayloadType: parseInt(codec.parameters.apt, 10),
      };
      if (primarySsrc && secondarySsrc) {
        encParam.rtx = {ssrc: secondarySsrc};
      }
      encodingParameters.push(encParam);
      if (hasRed) {
        encParam = JSON.parse(JSON.stringify(encParam));
        encParam.fec = {
          ssrc: secondarySsrc,
          mechanism: hasUlpfec ? 'red+ulpfec' : 'red'
        };
        encodingParameters.push(encParam);
      }
    }
  });
  if (encodingParameters.length === 0 && primarySsrc) {
    encodingParameters.push({
      ssrc: primarySsrc
    });
  }

  // we support both b=AS and b=TIAS but interpret AS as TIAS.
  var bandwidth = SDPUtils.matchPrefix(mediaSection, 'b=');
  if (bandwidth.length) {
    if (bandwidth[0].indexOf('b=TIAS:') === 0) {
      bandwidth = parseInt(bandwidth[0].substr(7), 10);
    } else if (bandwidth[0].indexOf('b=AS:') === 0) {
      // use formula from JSEP to convert b=AS to TIAS value.
      bandwidth = parseInt(bandwidth[0].substr(5), 10) * 1000 * 0.95
          - (50 * 40 * 8);
    } else {
      bandwidth = undefined;
    }
    encodingParameters.forEach(function(params) {
      params.maxBitrate = bandwidth;
    });
  }
  return encodingParameters;
};

// parses http://draft.ortc.org/#rtcrtcpparameters*
SDPUtils.parseRtcpParameters = function(mediaSection) {
  var rtcpParameters = {};

  var cname;
  // Gets the first SSRC. Note that with RTX there might be multiple
  // SSRCs.
  var remoteSsrc = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
      .map(function(line) {
        return SDPUtils.parseSsrcMedia(line);
      })
      .filter(function(obj) {
        return obj.attribute === 'cname';
      })[0];
  if (remoteSsrc) {
    rtcpParameters.cname = remoteSsrc.value;
    rtcpParameters.ssrc = remoteSsrc.ssrc;
  }

  // Edge uses the compound attribute instead of reducedSize
  // compound is !reducedSize
  var rsize = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-rsize');
  rtcpParameters.reducedSize = rsize.length > 0;
  rtcpParameters.compound = rsize.length === 0;

  // parses the rtcp-mux attrіbute.
  // Note that Edge does not support unmuxed RTCP.
  var mux = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-mux');
  rtcpParameters.mux = mux.length > 0;

  return rtcpParameters;
};

// parses either a=msid: or a=ssrc:... msid lines and returns
// the id of the MediaStream and MediaStreamTrack.
SDPUtils.parseMsid = function(mediaSection) {
  var parts;
  var spec = SDPUtils.matchPrefix(mediaSection, 'a=msid:');
  if (spec.length === 1) {
    parts = spec[0].substr(7).split(' ');
    return {stream: parts[0], track: parts[1]};
  }
  var planB = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
  .map(function(line) {
    return SDPUtils.parseSsrcMedia(line);
  })
  .filter(function(parts) {
    return parts.attribute === 'msid';
  });
  if (planB.length > 0) {
    parts = planB[0].value.split(' ');
    return {stream: parts[0], track: parts[1]};
  }
};

// Generate a session ID for SDP.
// https://tools.ietf.org/html/draft-ietf-rtcweb-jsep-20#section-5.2.1
// recommends using a cryptographically random +ve 64-bit value
// but right now this should be acceptable and within the right range
SDPUtils.generateSessionId = function() {
  return Math.random().toString().substr(2, 21);
};

// Write boilder plate for start of SDP
// sessId argument is optional - if not supplied it will
// be generated randomly
// sessVersion is optional and defaults to 2
SDPUtils.writeSessionBoilerplate = function(sessId, sessVer) {
  var sessionId;
  var version = sessVer !== undefined ? sessVer : 2;
  if (sessId) {
    sessionId = sessId;
  } else {
    sessionId = SDPUtils.generateSessionId();
  }
  // FIXME: sess-id should be an NTP timestamp.
  return 'v=0\r\n' +
      'o=thisisadapterortc ' + sessionId + ' ' + version + ' IN IP4 127.0.0.1\r\n' +
      's=-\r\n' +
      't=0 0\r\n';
};

SDPUtils.writeMediaSection = function(transceiver, caps, type, stream) {
  var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);

  // Map ICE parameters (ufrag, pwd) to SDP.
  sdp += SDPUtils.writeIceParameters(
      transceiver.iceGatherer.getLocalParameters());

  // Map DTLS parameters to SDP.
  sdp += SDPUtils.writeDtlsParameters(
      transceiver.dtlsTransport.getLocalParameters(),
      type === 'offer' ? 'actpass' : 'active');

  sdp += 'a=mid:' + transceiver.mid + '\r\n';

  if (transceiver.direction) {
    sdp += 'a=' + transceiver.direction + '\r\n';
  } else if (transceiver.rtpSender && transceiver.rtpReceiver) {
    sdp += 'a=sendrecv\r\n';
  } else if (transceiver.rtpSender) {
    sdp += 'a=sendonly\r\n';
  } else if (transceiver.rtpReceiver) {
    sdp += 'a=recvonly\r\n';
  } else {
    sdp += 'a=inactive\r\n';
  }

  if (transceiver.rtpSender) {
    // spec.
    var msid = 'msid:' + stream.id + ' ' +
        transceiver.rtpSender.track.id + '\r\n';
    sdp += 'a=' + msid;

    // for Chrome.
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
        ' ' + msid;
    if (transceiver.sendEncodingParameters[0].rtx) {
      sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
          ' ' + msid;
      sdp += 'a=ssrc-group:FID ' +
          transceiver.sendEncodingParameters[0].ssrc + ' ' +
          transceiver.sendEncodingParameters[0].rtx.ssrc +
          '\r\n';
    }
  }
  // FIXME: this should be written by writeRtpDescription.
  sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
      ' cname:' + SDPUtils.localCName + '\r\n';
  if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
        ' cname:' + SDPUtils.localCName + '\r\n';
  }
  return sdp;
};

// Gets the direction from the mediaSection or the sessionpart.
SDPUtils.getDirection = function(mediaSection, sessionpart) {
  // Look for sendrecv, sendonly, recvonly, inactive, default to sendrecv.
  var lines = SDPUtils.splitLines(mediaSection);
  for (var i = 0; i < lines.length; i++) {
    switch (lines[i]) {
      case 'a=sendrecv':
      case 'a=sendonly':
      case 'a=recvonly':
      case 'a=inactive':
        return lines[i].substr(2);
      default:
        // FIXME: What should happen here?
    }
  }
  if (sessionpart) {
    return SDPUtils.getDirection(sessionpart);
  }
  return 'sendrecv';
};

SDPUtils.getKind = function(mediaSection) {
  var lines = SDPUtils.splitLines(mediaSection);
  var mline = lines[0].split(' ');
  return mline[0].substr(2);
};

SDPUtils.isRejected = function(mediaSection) {
  return mediaSection.split(' ', 2)[1] === '0';
};

SDPUtils.parseMLine = function(mediaSection) {
  var lines = SDPUtils.splitLines(mediaSection);
  var parts = lines[0].substr(2).split(' ');
  return {
    kind: parts[0],
    port: parseInt(parts[1], 10),
    protocol: parts[2],
    fmt: parts.slice(3).join(' ')
  };
};

SDPUtils.parseOLine = function(mediaSection) {
  var line = SDPUtils.matchPrefix(mediaSection, 'o=')[0];
  var parts = line.substr(2).split(' ');
  return {
    username: parts[0],
    sessionId: parts[1],
    sessionVersion: parseInt(parts[2], 10),
    netType: parts[3],
    addressType: parts[4],
    address: parts[5],
  };
}

// Expose public methods.
if (typeof module === 'object') {
  module.exports = SDPUtils;
}

},{}],3:[function(require,module,exports){
(function (global){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */



var adapterFactory = require('./adapter_factory.js');
module.exports = adapterFactory({window: global.window});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./adapter_factory.js":4}],4:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */



var utils = require('./utils');
// Shimming starts here.
module.exports = function(dependencies, opts) {
  var window = dependencies && dependencies.window;

  var options = {
    shimChrome: true,
    shimFirefox: true,
    shimEdge: true,
    shimSafari: true,
  };

  for (var key in opts) {
    if (hasOwnProperty.call(opts, key)) {
      options[key] = opts[key];
    }
  }

  // Utils.
  var logging = utils.log;
  var browserDetails = utils.detectBrowser(window);

  // Uncomment the line below if you want logging to occur, including logging
  // for the switch statement below. Can also be turned on in the browser via
  // adapter.disableLog(false), but then logging from the switch statement below
  // will not appear.
  // require('./utils').disableLog(false);

  // Browser shims.
  var chromeShim = require('./chrome/chrome_shim') || null;
  var edgeShim = require('./edge/edge_shim') || null;
  var firefoxShim = require('./firefox/firefox_shim') || null;
  var safariShim = require('./safari/safari_shim') || null;
  var commonShim = require('./common_shim') || null;

  // Export to the adapter global object visible in the browser.
  var adapter = {
    browserDetails: browserDetails,
    commonShim: commonShim,
    extractVersion: utils.extractVersion,
    disableLog: utils.disableLog,
    disableWarnings: utils.disableWarnings
  };

  // Shim browser if found.
  switch (browserDetails.browser) {
    case 'chrome':
      if (!chromeShim || !chromeShim.shimPeerConnection ||
          !options.shimChrome) {
        logging('Chrome shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming chrome.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = chromeShim;
      commonShim.shimCreateObjectURL(window);

      chromeShim.shimGetUserMedia(window);
      chromeShim.shimMediaStream(window);
      chromeShim.shimSourceObject(window);
      chromeShim.shimPeerConnection(window);
      chromeShim.shimOnTrack(window);
      chromeShim.shimAddTrackRemoveTrack(window);
      chromeShim.shimGetSendersWithDtmf(window);
      chromeShim.shimSenderReceiverGetStats(window);
      chromeShim.fixNegotiationNeeded(window);

      commonShim.shimRTCIceCandidate(window);
      commonShim.shimMaxMessageSize(window);
      commonShim.shimSendThrowTypeError(window);
      break;
    case 'firefox':
      if (!firefoxShim || !firefoxShim.shimPeerConnection ||
          !options.shimFirefox) {
        logging('Firefox shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming firefox.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = firefoxShim;
      commonShim.shimCreateObjectURL(window);

      firefoxShim.shimGetUserMedia(window);
      firefoxShim.shimSourceObject(window);
      firefoxShim.shimPeerConnection(window);
      firefoxShim.shimOnTrack(window);
      firefoxShim.shimRemoveStream(window);
      firefoxShim.shimSenderGetStats(window);
      firefoxShim.shimReceiverGetStats(window);
      firefoxShim.shimRTCDataChannel(window);

      commonShim.shimRTCIceCandidate(window);
      commonShim.shimMaxMessageSize(window);
      commonShim.shimSendThrowTypeError(window);
      break;
    case 'edge':
      if (!edgeShim || !edgeShim.shimPeerConnection || !options.shimEdge) {
        logging('MS edge shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming edge.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = edgeShim;
      commonShim.shimCreateObjectURL(window);

      edgeShim.shimGetUserMedia(window);
      edgeShim.shimPeerConnection(window);
      edgeShim.shimReplaceTrack(window);

      // the edge shim implements the full RTCIceCandidate object.

      commonShim.shimMaxMessageSize(window);
      commonShim.shimSendThrowTypeError(window);
      break;
    case 'safari':
      if (!safariShim || !options.shimSafari) {
        logging('Safari shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming safari.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = safariShim;
      commonShim.shimCreateObjectURL(window);

      safariShim.shimRTCIceServerUrls(window);
      safariShim.shimCallbacksAPI(window);
      safariShim.shimLocalStreamsAPI(window);
      safariShim.shimRemoteStreamsAPI(window);
      safariShim.shimTrackEventTransceiver(window);
      safariShim.shimGetUserMedia(window);
      safariShim.shimCreateOfferLegacy(window);

      commonShim.shimRTCIceCandidate(window);
      commonShim.shimMaxMessageSize(window);
      commonShim.shimSendThrowTypeError(window);
      break;
    default:
      logging('Unsupported browser!');
      break;
  }

  return adapter;
};

},{"./chrome/chrome_shim":5,"./common_shim":7,"./edge/edge_shim":8,"./firefox/firefox_shim":11,"./safari/safari_shim":13,"./utils":14}],5:[function(require,module,exports){

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */

var utils = require('../utils.js');
var logging = utils.log;

/* iterates the stats graph recursively. */
function walkStats(stats, base, resultSet) {
  if (!base || resultSet.has(base.id)) {
    return;
  }
  resultSet.set(base.id, base);
  Object.keys(base).forEach(function(name) {
    if (name.endsWith('Id')) {
      walkStats(stats, stats.get(base[name]), resultSet);
    } else if (name.endsWith('Ids')) {
      base[name].forEach(function(id) {
        walkStats(stats, stats.get(id), resultSet);
      });
    }
  });
}

/* filter getStats for a sender/receiver track. */
function filterStats(result, track, outbound) {
  var streamStatsType = outbound ? 'outbound-rtp' : 'inbound-rtp';
  var filteredResult = new Map();
  if (track === null) {
    return filteredResult;
  }
  var trackStats = [];
  result.forEach(function(value) {
    if (value.type === 'track' &&
        value.trackIdentifier === track.id) {
      trackStats.push(value);
    }
  });
  trackStats.forEach(function(trackStat) {
    result.forEach(function(stats) {
      if (stats.type === streamStatsType && stats.trackId === trackStat.id) {
        walkStats(result, stats, filteredResult);
      }
    });
  });
  return filteredResult;
}

module.exports = {
  shimGetUserMedia: require('./getusermedia'),
  shimMediaStream: function(window) {
    window.MediaStream = window.MediaStream || window.webkitMediaStream;
  },

  shimOnTrack: function(window) {
    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
        window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
        get: function() {
          return this._ontrack;
        },
        set: function(f) {
          if (this._ontrack) {
            this.removeEventListener('track', this._ontrack);
          }
          this.addEventListener('track', this._ontrack = f);
        },
        enumerable: true,
        configurable: true
      });
      var origSetRemoteDescription =
          window.RTCPeerConnection.prototype.setRemoteDescription;
      window.RTCPeerConnection.prototype.setRemoteDescription = function() {
        var pc = this;
        if (!pc._ontrackpoly) {
          pc._ontrackpoly = function(e) {
            // onaddstream does not fire when a track is added to an existing
            // stream. But stream.onaddtrack is implemented so we use that.
            e.stream.addEventListener('addtrack', function(te) {
              var receiver;
              if (window.RTCPeerConnection.prototype.getReceivers) {
                receiver = pc.getReceivers().find(function(r) {
                  return r.track && r.track.id === te.track.id;
                });
              } else {
                receiver = {track: te.track};
              }

              var event = new Event('track');
              event.track = te.track;
              event.receiver = receiver;
              event.transceiver = {receiver: receiver};
              event.streams = [e.stream];
              pc.dispatchEvent(event);
            });
            e.stream.getTracks().forEach(function(track) {
              var receiver;
              if (window.RTCPeerConnection.prototype.getReceivers) {
                receiver = pc.getReceivers().find(function(r) {
                  return r.track && r.track.id === track.id;
                });
              } else {
                receiver = {track: track};
              }
              var event = new Event('track');
              event.track = track;
              event.receiver = receiver;
              event.transceiver = {receiver: receiver};
              event.streams = [e.stream];
              pc.dispatchEvent(event);
            });
          };
          pc.addEventListener('addstream', pc._ontrackpoly);
        }
        return origSetRemoteDescription.apply(pc, arguments);
      };
    } else if (!('RTCRtpTransceiver' in window)) {
      utils.wrapPeerConnectionEvent(window, 'track', function(e) {
        if (!e.transceiver) {
          e.transceiver = {receiver: e.receiver};
        }
        return e;
      });
    }
  },

  shimGetSendersWithDtmf: function(window) {
    // Overrides addTrack/removeTrack, depends on shimAddTrackRemoveTrack.
    if (typeof window === 'object' && window.RTCPeerConnection &&
        !('getSenders' in window.RTCPeerConnection.prototype) &&
        'createDTMFSender' in window.RTCPeerConnection.prototype) {
      var shimSenderWithDtmf = function(pc, track) {
        return {
          track: track,
          get dtmf() {
            if (this._dtmf === undefined) {
              if (track.kind === 'audio') {
                this._dtmf = pc.createDTMFSender(track);
              } else {
                this._dtmf = null;
              }
            }
            return this._dtmf;
          },
          _pc: pc
        };
      };

      // augment addTrack when getSenders is not available.
      if (!window.RTCPeerConnection.prototype.getSenders) {
        window.RTCPeerConnection.prototype.getSenders = function() {
          this._senders = this._senders || [];
          return this._senders.slice(); // return a copy of the internal state.
        };
        var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
        window.RTCPeerConnection.prototype.addTrack = function(track, stream) {
          var pc = this;
          var sender = origAddTrack.apply(pc, arguments);
          if (!sender) {
            sender = shimSenderWithDtmf(pc, track);
            pc._senders.push(sender);
          }
          return sender;
        };

        var origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;
        window.RTCPeerConnection.prototype.removeTrack = function(sender) {
          var pc = this;
          origRemoveTrack.apply(pc, arguments);
          var idx = pc._senders.indexOf(sender);
          if (idx !== -1) {
            pc._senders.splice(idx, 1);
          }
        };
      }
      var origAddStream = window.RTCPeerConnection.prototype.addStream;
      window.RTCPeerConnection.prototype.addStream = function(stream) {
        var pc = this;
        pc._senders = pc._senders || [];
        origAddStream.apply(pc, [stream]);
        stream.getTracks().forEach(function(track) {
          pc._senders.push(shimSenderWithDtmf(pc, track));
        });
      };

      var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
      window.RTCPeerConnection.prototype.removeStream = function(stream) {
        var pc = this;
        pc._senders = pc._senders || [];
        origRemoveStream.apply(pc, [stream]);

        stream.getTracks().forEach(function(track) {
          var sender = pc._senders.find(function(s) {
            return s.track === track;
          });
          if (sender) {
            pc._senders.splice(pc._senders.indexOf(sender), 1); // remove sender
          }
        });
      };
    } else if (typeof window === 'object' && window.RTCPeerConnection &&
               'getSenders' in window.RTCPeerConnection.prototype &&
               'createDTMFSender' in window.RTCPeerConnection.prototype &&
               window.RTCRtpSender &&
               !('dtmf' in window.RTCRtpSender.prototype)) {
      var origGetSenders = window.RTCPeerConnection.prototype.getSenders;
      window.RTCPeerConnection.prototype.getSenders = function() {
        var pc = this;
        var senders = origGetSenders.apply(pc, []);
        senders.forEach(function(sender) {
          sender._pc = pc;
        });
        return senders;
      };

      Object.defineProperty(window.RTCRtpSender.prototype, 'dtmf', {
        get: function() {
          if (this._dtmf === undefined) {
            if (this.track.kind === 'audio') {
              this._dtmf = this._pc.createDTMFSender(this.track);
            } else {
              this._dtmf = null;
            }
          }
          return this._dtmf;
        }
      });
    }
  },

  shimSenderReceiverGetStats: function(window) {
    if (!(typeof window === 'object' && window.RTCPeerConnection &&
        window.RTCRtpSender && window.RTCRtpReceiver)) {
      return;
    }

    // shim sender stats.
    if (!('getStats' in window.RTCRtpSender.prototype)) {
      var origGetSenders = window.RTCPeerConnection.prototype.getSenders;
      if (origGetSenders) {
        window.RTCPeerConnection.prototype.getSenders = function() {
          var pc = this;
          var senders = origGetSenders.apply(pc, []);
          senders.forEach(function(sender) {
            sender._pc = pc;
          });
          return senders;
        };
      }

      var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
      if (origAddTrack) {
        window.RTCPeerConnection.prototype.addTrack = function() {
          var sender = origAddTrack.apply(this, arguments);
          sender._pc = this;
          return sender;
        };
      }
      window.RTCRtpSender.prototype.getStats = function() {
        var sender = this;
        return this._pc.getStats().then(function(result) {
          /* Note: this will include stats of all senders that
           *   send a track with the same id as sender.track as
           *   it is not possible to identify the RTCRtpSender.
           */
          return filterStats(result, sender.track, true);
        });
      };
    }

    // shim receiver stats.
    if (!('getStats' in window.RTCRtpReceiver.prototype)) {
      var origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;
      if (origGetReceivers) {
        window.RTCPeerConnection.prototype.getReceivers = function() {
          var pc = this;
          var receivers = origGetReceivers.apply(pc, []);
          receivers.forEach(function(receiver) {
            receiver._pc = pc;
          });
          return receivers;
        };
      }
      utils.wrapPeerConnectionEvent(window, 'track', function(e) {
        e.receiver._pc = e.srcElement;
        return e;
      });
      window.RTCRtpReceiver.prototype.getStats = function() {
        var receiver = this;
        return this._pc.getStats().then(function(result) {
          return filterStats(result, receiver.track, false);
        });
      };
    }

    if (!('getStats' in window.RTCRtpSender.prototype &&
        'getStats' in window.RTCRtpReceiver.prototype)) {
      return;
    }

    // shim RTCPeerConnection.getStats(track).
    var origGetStats = window.RTCPeerConnection.prototype.getStats;
    window.RTCPeerConnection.prototype.getStats = function() {
      var pc = this;
      if (arguments.length > 0 &&
          arguments[0] instanceof window.MediaStreamTrack) {
        var track = arguments[0];
        var sender;
        var receiver;
        var err;
        pc.getSenders().forEach(function(s) {
          if (s.track === track) {
            if (sender) {
              err = true;
            } else {
              sender = s;
            }
          }
        });
        pc.getReceivers().forEach(function(r) {
          if (r.track === track) {
            if (receiver) {
              err = true;
            } else {
              receiver = r;
            }
          }
          return r.track === track;
        });
        if (err || (sender && receiver)) {
          return Promise.reject(new DOMException(
            'There are more than one sender or receiver for the track.',
            'InvalidAccessError'));
        } else if (sender) {
          return sender.getStats();
        } else if (receiver) {
          return receiver.getStats();
        }
        return Promise.reject(new DOMException(
          'There is no sender or receiver for the track.',
          'InvalidAccessError'));
      }
      return origGetStats.apply(pc, arguments);
    };
  },

  shimSourceObject: function(window) {
    var URL = window && window.URL;

    if (typeof window === 'object') {
      if (window.HTMLMediaElement &&
        !('srcObject' in window.HTMLMediaElement.prototype)) {
        // Shim the srcObject property, once, when HTMLMediaElement is found.
        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
          get: function() {
            return this._srcObject;
          },
          set: function(stream) {
            var self = this;
            // Use _srcObject as a private property for this shim
            this._srcObject = stream;
            if (this.src) {
              URL.revokeObjectURL(this.src);
            }

            if (!stream) {
              this.src = '';
              return undefined;
            }
            this.src = URL.createObjectURL(stream);
            // We need to recreate the blob url when a track is added or
            // removed. Doing it manually since we want to avoid a recursion.
            stream.addEventListener('addtrack', function() {
              if (self.src) {
                URL.revokeObjectURL(self.src);
              }
              self.src = URL.createObjectURL(stream);
            });
            stream.addEventListener('removetrack', function() {
              if (self.src) {
                URL.revokeObjectURL(self.src);
              }
              self.src = URL.createObjectURL(stream);
            });
          }
        });
      }
    }
  },

  shimAddTrackRemoveTrackWithNative: function(window) {
    // shim addTrack/removeTrack with native variants in order to make
    // the interactions with legacy getLocalStreams behave as in other browsers.
    // Keeps a mapping stream.id => [stream, rtpsenders...]
    window.RTCPeerConnection.prototype.getLocalStreams = function() {
      var pc = this;
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      return Object.keys(this._shimmedLocalStreams).map(function(streamId) {
        return pc._shimmedLocalStreams[streamId][0];
      });
    };

    var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
    window.RTCPeerConnection.prototype.addTrack = function(track, stream) {
      if (!stream) {
        return origAddTrack.apply(this, arguments);
      }
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};

      var sender = origAddTrack.apply(this, arguments);
      if (!this._shimmedLocalStreams[stream.id]) {
        this._shimmedLocalStreams[stream.id] = [stream, sender];
      } else if (this._shimmedLocalStreams[stream.id].indexOf(sender) === -1) {
        this._shimmedLocalStreams[stream.id].push(sender);
      }
      return sender;
    };

    var origAddStream = window.RTCPeerConnection.prototype.addStream;
    window.RTCPeerConnection.prototype.addStream = function(stream) {
      var pc = this;
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};

      stream.getTracks().forEach(function(track) {
        var alreadyExists = pc.getSenders().find(function(s) {
          return s.track === track;
        });
        if (alreadyExists) {
          throw new DOMException('Track already exists.',
              'InvalidAccessError');
        }
      });
      var existingSenders = pc.getSenders();
      origAddStream.apply(this, arguments);
      var newSenders = pc.getSenders().filter(function(newSender) {
        return existingSenders.indexOf(newSender) === -1;
      });
      this._shimmedLocalStreams[stream.id] = [stream].concat(newSenders);
    };

    var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
    window.RTCPeerConnection.prototype.removeStream = function(stream) {
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      delete this._shimmedLocalStreams[stream.id];
      return origRemoveStream.apply(this, arguments);
    };

    var origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;
    window.RTCPeerConnection.prototype.removeTrack = function(sender) {
      var pc = this;
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      if (sender) {
        Object.keys(this._shimmedLocalStreams).forEach(function(streamId) {
          var idx = pc._shimmedLocalStreams[streamId].indexOf(sender);
          if (idx !== -1) {
            pc._shimmedLocalStreams[streamId].splice(idx, 1);
          }
          if (pc._shimmedLocalStreams[streamId].length === 1) {
            delete pc._shimmedLocalStreams[streamId];
          }
        });
      }
      return origRemoveTrack.apply(this, arguments);
    };
  },

  shimAddTrackRemoveTrack: function(window) {
    var browserDetails = utils.detectBrowser(window);
    // shim addTrack and removeTrack.
    if (window.RTCPeerConnection.prototype.addTrack &&
        browserDetails.version >= 65) {
      return this.shimAddTrackRemoveTrackWithNative(window);
    }

    // also shim pc.getLocalStreams when addTrack is shimmed
    // to return the original streams.
    var origGetLocalStreams = window.RTCPeerConnection.prototype
        .getLocalStreams;
    window.RTCPeerConnection.prototype.getLocalStreams = function() {
      var pc = this;
      var nativeStreams = origGetLocalStreams.apply(this);
      pc._reverseStreams = pc._reverseStreams || {};
      return nativeStreams.map(function(stream) {
        return pc._reverseStreams[stream.id];
      });
    };

    var origAddStream = window.RTCPeerConnection.prototype.addStream;
    window.RTCPeerConnection.prototype.addStream = function(stream) {
      var pc = this;
      pc._streams = pc._streams || {};
      pc._reverseStreams = pc._reverseStreams || {};

      stream.getTracks().forEach(function(track) {
        var alreadyExists = pc.getSenders().find(function(s) {
          return s.track === track;
        });
        if (alreadyExists) {
          throw new DOMException('Track already exists.',
              'InvalidAccessError');
        }
      });
      // Add identity mapping for consistency with addTrack.
      // Unless this is being used with a stream from addTrack.
      if (!pc._reverseStreams[stream.id]) {
        var newStream = new window.MediaStream(stream.getTracks());
        pc._streams[stream.id] = newStream;
        pc._reverseStreams[newStream.id] = stream;
        stream = newStream;
      }
      origAddStream.apply(pc, [stream]);
    };

    var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
    window.RTCPeerConnection.prototype.removeStream = function(stream) {
      var pc = this;
      pc._streams = pc._streams || {};
      pc._reverseStreams = pc._reverseStreams || {};

      origRemoveStream.apply(pc, [(pc._streams[stream.id] || stream)]);
      delete pc._reverseStreams[(pc._streams[stream.id] ?
          pc._streams[stream.id].id : stream.id)];
      delete pc._streams[stream.id];
    };

    window.RTCPeerConnection.prototype.addTrack = function(track, stream) {
      var pc = this;
      if (pc.signalingState === 'closed') {
        throw new DOMException(
          'The RTCPeerConnection\'s signalingState is \'closed\'.',
          'InvalidStateError');
      }
      var streams = [].slice.call(arguments, 1);
      if (streams.length !== 1 ||
          !streams[0].getTracks().find(function(t) {
            return t === track;
          })) {
        // this is not fully correct but all we can manage without
        // [[associated MediaStreams]] internal slot.
        throw new DOMException(
          'The adapter.js addTrack polyfill only supports a single ' +
          ' stream which is associated with the specified track.',
          'NotSupportedError');
      }

      var alreadyExists = pc.getSenders().find(function(s) {
        return s.track === track;
      });
      if (alreadyExists) {
        throw new DOMException('Track already exists.',
            'InvalidAccessError');
      }

      pc._streams = pc._streams || {};
      pc._reverseStreams = pc._reverseStreams || {};
      var oldStream = pc._streams[stream.id];
      if (oldStream) {
        // this is using odd Chrome behaviour, use with caution:
        // https://bugs.chromium.org/p/webrtc/issues/detail?id=7815
        // Note: we rely on the high-level addTrack/dtmf shim to
        // create the sender with a dtmf sender.
        oldStream.addTrack(track);

        // Trigger ONN async.
        Promise.resolve().then(function() {
          pc.dispatchEvent(new Event('negotiationneeded'));
        });
      } else {
        var newStream = new window.MediaStream([track]);
        pc._streams[stream.id] = newStream;
        pc._reverseStreams[newStream.id] = stream;
        pc.addStream(newStream);
      }
      return pc.getSenders().find(function(s) {
        return s.track === track;
      });
    };

    // replace the internal stream id with the external one and
    // vice versa.
    function replaceInternalStreamId(pc, description) {
      var sdp = description.sdp;
      Object.keys(pc._reverseStreams || []).forEach(function(internalId) {
        var externalStream = pc._reverseStreams[internalId];
        var internalStream = pc._streams[externalStream.id];
        sdp = sdp.replace(new RegExp(internalStream.id, 'g'),
            externalStream.id);
      });
      return new RTCSessionDescription({
        type: description.type,
        sdp: sdp
      });
    }
    function replaceExternalStreamId(pc, description) {
      var sdp = description.sdp;
      Object.keys(pc._reverseStreams || []).forEach(function(internalId) {
        var externalStream = pc._reverseStreams[internalId];
        var internalStream = pc._streams[externalStream.id];
        sdp = sdp.replace(new RegExp(externalStream.id, 'g'),
            internalStream.id);
      });
      return new RTCSessionDescription({
        type: description.type,
        sdp: sdp
      });
    }
    ['createOffer', 'createAnswer'].forEach(function(method) {
      var nativeMethod = window.RTCPeerConnection.prototype[method];
      window.RTCPeerConnection.prototype[method] = function() {
        var pc = this;
        var args = arguments;
        var isLegacyCall = arguments.length &&
            typeof arguments[0] === 'function';
        if (isLegacyCall) {
          return nativeMethod.apply(pc, [
            function(description) {
              var desc = replaceInternalStreamId(pc, description);
              args[0].apply(null, [desc]);
            },
            function(err) {
              if (args[1]) {
                args[1].apply(null, err);
              }
            }, arguments[2]
          ]);
        }
        return nativeMethod.apply(pc, arguments)
        .then(function(description) {
          return replaceInternalStreamId(pc, description);
        });
      };
    });

    var origSetLocalDescription =
        window.RTCPeerConnection.prototype.setLocalDescription;
    window.RTCPeerConnection.prototype.setLocalDescription = function() {
      var pc = this;
      if (!arguments.length || !arguments[0].type) {
        return origSetLocalDescription.apply(pc, arguments);
      }
      arguments[0] = replaceExternalStreamId(pc, arguments[0]);
      return origSetLocalDescription.apply(pc, arguments);
    };

    // TODO: mangle getStats: https://w3c.github.io/webrtc-stats/#dom-rtcmediastreamstats-streamidentifier

    var origLocalDescription = Object.getOwnPropertyDescriptor(
        window.RTCPeerConnection.prototype, 'localDescription');
    Object.defineProperty(window.RTCPeerConnection.prototype,
        'localDescription', {
          get: function() {
            var pc = this;
            var description = origLocalDescription.get.apply(this);
            if (description.type === '') {
              return description;
            }
            return replaceInternalStreamId(pc, description);
          }
        });

    window.RTCPeerConnection.prototype.removeTrack = function(sender) {
      var pc = this;
      if (pc.signalingState === 'closed') {
        throw new DOMException(
          'The RTCPeerConnection\'s signalingState is \'closed\'.',
          'InvalidStateError');
      }
      // We can not yet check for sender instanceof RTCRtpSender
      // since we shim RTPSender. So we check if sender._pc is set.
      if (!sender._pc) {
        throw new DOMException('Argument 1 of RTCPeerConnection.removeTrack ' +
            'does not implement interface RTCRtpSender.', 'TypeError');
      }
      var isLocal = sender._pc === pc;
      if (!isLocal) {
        throw new DOMException('Sender was not created by this connection.',
            'InvalidAccessError');
      }

      // Search for the native stream the senders track belongs to.
      pc._streams = pc._streams || {};
      var stream;
      Object.keys(pc._streams).forEach(function(streamid) {
        var hasTrack = pc._streams[streamid].getTracks().find(function(track) {
          return sender.track === track;
        });
        if (hasTrack) {
          stream = pc._streams[streamid];
        }
      });

      if (stream) {
        if (stream.getTracks().length === 1) {
          // if this is the last track of the stream, remove the stream. This
          // takes care of any shimmed _senders.
          pc.removeStream(pc._reverseStreams[stream.id]);
        } else {
          // relying on the same odd chrome behaviour as above.
          stream.removeTrack(sender.track);
        }
        pc.dispatchEvent(new Event('negotiationneeded'));
      }
    };
  },

  shimPeerConnection: function(window) {
    var browserDetails = utils.detectBrowser(window);

    // The RTCPeerConnection object.
    if (!window.RTCPeerConnection && window.webkitRTCPeerConnection) {
      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
        // Translate iceTransportPolicy to iceTransports,
        // see https://code.google.com/p/webrtc/issues/detail?id=4869
        // this was fixed in M56 along with unprefixing RTCPeerConnection.
        logging('PeerConnection');
        if (pcConfig && pcConfig.iceTransportPolicy) {
          pcConfig.iceTransports = pcConfig.iceTransportPolicy;
        }

        return new window.webkitRTCPeerConnection(pcConfig, pcConstraints);
      };
      window.RTCPeerConnection.prototype =
          window.webkitRTCPeerConnection.prototype;
      // wrap static methods. Currently just generateCertificate.
      if (window.webkitRTCPeerConnection.generateCertificate) {
        Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
          get: function() {
            return window.webkitRTCPeerConnection.generateCertificate;
          }
        });
      }
    } else {
      // migrate from non-spec RTCIceServer.url to RTCIceServer.urls
      var OrigPeerConnection = window.RTCPeerConnection;
      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
        if (pcConfig && pcConfig.iceServers) {
          var newIceServers = [];
          for (var i = 0; i < pcConfig.iceServers.length; i++) {
            var server = pcConfig.iceServers[i];
            if (!server.hasOwnProperty('urls') &&
                server.hasOwnProperty('url')) {
              utils.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
              server = JSON.parse(JSON.stringify(server));
              server.urls = server.url;
              newIceServers.push(server);
            } else {
              newIceServers.push(pcConfig.iceServers[i]);
            }
          }
          pcConfig.iceServers = newIceServers;
        }
        return new OrigPeerConnection(pcConfig, pcConstraints);
      };
      window.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
      // wrap static methods. Currently just generateCertificate.
      Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
        get: function() {
          return OrigPeerConnection.generateCertificate;
        }
      });
    }

    var origGetStats = window.RTCPeerConnection.prototype.getStats;
    window.RTCPeerConnection.prototype.getStats = function(selector,
        successCallback, errorCallback) {
      var pc = this;
      var args = arguments;

      // If selector is a function then we are in the old style stats so just
      // pass back the original getStats format to avoid breaking old users.
      if (arguments.length > 0 && typeof selector === 'function') {
        return origGetStats.apply(this, arguments);
      }

      // When spec-style getStats is supported, return those when called with
      // either no arguments or the selector argument is null.
      if (origGetStats.length === 0 && (arguments.length === 0 ||
          typeof arguments[0] !== 'function')) {
        return origGetStats.apply(this, []);
      }

      var fixChromeStats_ = function(response) {
        var standardReport = {};
        var reports = response.result();
        reports.forEach(function(report) {
          var standardStats = {
            id: report.id,
            timestamp: report.timestamp,
            type: {
              localcandidate: 'local-candidate',
              remotecandidate: 'remote-candidate'
            }[report.type] || report.type
          };
          report.names().forEach(function(name) {
            standardStats[name] = report.stat(name);
          });
          standardReport[standardStats.id] = standardStats;
        });

        return standardReport;
      };

      // shim getStats with maplike support
      var makeMapStats = function(stats) {
        return new Map(Object.keys(stats).map(function(key) {
          return [key, stats[key]];
        }));
      };

      if (arguments.length >= 2) {
        var successCallbackWrapper_ = function(response) {
          args[1](makeMapStats(fixChromeStats_(response)));
        };

        return origGetStats.apply(this, [successCallbackWrapper_,
          arguments[0]]);
      }

      // promise-support
      return new Promise(function(resolve, reject) {
        origGetStats.apply(pc, [
          function(response) {
            resolve(makeMapStats(fixChromeStats_(response)));
          }, reject]);
      }).then(successCallback, errorCallback);
    };

    // add promise support -- natively available in Chrome 51
    if (browserDetails.version < 51) {
      ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
          .forEach(function(method) {
            var nativeMethod = window.RTCPeerConnection.prototype[method];
            window.RTCPeerConnection.prototype[method] = function() {
              var args = arguments;
              var pc = this;
              var promise = new Promise(function(resolve, reject) {
                nativeMethod.apply(pc, [args[0], resolve, reject]);
              });
              if (args.length < 2) {
                return promise;
              }
              return promise.then(function() {
                args[1].apply(null, []);
              },
              function(err) {
                if (args.length >= 3) {
                  args[2].apply(null, [err]);
                }
              });
            };
          });
    }

    // promise support for createOffer and createAnswer. Available (without
    // bugs) since M52: crbug/619289
    if (browserDetails.version < 52) {
      ['createOffer', 'createAnswer'].forEach(function(method) {
        var nativeMethod = window.RTCPeerConnection.prototype[method];
        window.RTCPeerConnection.prototype[method] = function() {
          var pc = this;
          if (arguments.length < 1 || (arguments.length === 1 &&
              typeof arguments[0] === 'object')) {
            var opts = arguments.length === 1 ? arguments[0] : undefined;
            return new Promise(function(resolve, reject) {
              nativeMethod.apply(pc, [resolve, reject, opts]);
            });
          }
          return nativeMethod.apply(this, arguments);
        };
      });
    }

    // shim implicit creation of RTCSessionDescription/RTCIceCandidate
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          var nativeMethod = window.RTCPeerConnection.prototype[method];
          window.RTCPeerConnection.prototype[method] = function() {
            arguments[0] = new ((method === 'addIceCandidate') ?
                window.RTCIceCandidate :
                window.RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          };
        });

    // support for addIceCandidate(null or undefined)
    var nativeAddIceCandidate =
        window.RTCPeerConnection.prototype.addIceCandidate;
    window.RTCPeerConnection.prototype.addIceCandidate = function() {
      if (!arguments[0]) {
        if (arguments[1]) {
          arguments[1].apply(null);
        }
        return Promise.resolve();
      }
      return nativeAddIceCandidate.apply(this, arguments);
    };
  },

  fixNegotiationNeeded: function(window) {
    utils.wrapPeerConnectionEvent(window, 'negotiationneeded', function(e) {
      var pc = e.target;
      if (pc.signalingState !== 'stable') {
        return;
      }
      return e;
    });
  },

  shimGetDisplayMedia: function(window, getSourceId) {
    if ('getDisplayMedia' in window.navigator) {
      return;
    }
    // getSourceId is a function that returns a promise resolving with
    // the sourceId of the screen/window/tab to be shared.
    if (typeof getSourceId !== 'function') {
      console.error('shimGetDisplayMedia: getSourceId argument is not ' +
          'a function');
      return;
    }
    navigator.getDisplayMedia = function(constraints) {
      return getSourceId(constraints)
        .then(function(sourceId) {
          constraints.video = {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              maxFrameRate: constraints.video.frameRate || 3
            }
          };
          return navigator.mediaDevices.getUserMedia(constraints);
        });
    };
  }
};

},{"../utils.js":14,"./getusermedia":6}],6:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */

var utils = require('../utils.js');
var logging = utils.log;

// Expose public methods.
module.exports = function(window) {
  var browserDetails = utils.detectBrowser(window);
  var navigator = window && window.navigator;

  var constraintsToChrome_ = function(c) {
    if (typeof c !== 'object' || c.mandatory || c.optional) {
      return c;
    }
    var cc = {};
    Object.keys(c).forEach(function(key) {
      if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
        return;
      }
      var r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
      if (r.exact !== undefined && typeof r.exact === 'number') {
        r.min = r.max = r.exact;
      }
      var oldname_ = function(prefix, name) {
        if (prefix) {
          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
        }
        return (name === 'deviceId') ? 'sourceId' : name;
      };
      if (r.ideal !== undefined) {
        cc.optional = cc.optional || [];
        var oc = {};
        if (typeof r.ideal === 'number') {
          oc[oldname_('min', key)] = r.ideal;
          cc.optional.push(oc);
          oc = {};
          oc[oldname_('max', key)] = r.ideal;
          cc.optional.push(oc);
        } else {
          oc[oldname_('', key)] = r.ideal;
          cc.optional.push(oc);
        }
      }
      if (r.exact !== undefined && typeof r.exact !== 'number') {
        cc.mandatory = cc.mandatory || {};
        cc.mandatory[oldname_('', key)] = r.exact;
      } else {
        ['min', 'max'].forEach(function(mix) {
          if (r[mix] !== undefined) {
            cc.mandatory = cc.mandatory || {};
            cc.mandatory[oldname_(mix, key)] = r[mix];
          }
        });
      }
    });
    if (c.advanced) {
      cc.optional = (cc.optional || []).concat(c.advanced);
    }
    return cc;
  };

  var shimConstraints_ = function(constraints, func) {
    if (browserDetails.version >= 61) {
      return func(constraints);
    }
    constraints = JSON.parse(JSON.stringify(constraints));
    if (constraints && typeof constraints.audio === 'object') {
      var remap = function(obj, a, b) {
        if (a in obj && !(b in obj)) {
          obj[b] = obj[a];
          delete obj[a];
        }
      };
      constraints = JSON.parse(JSON.stringify(constraints));
      remap(constraints.audio, 'autoGainControl', 'googAutoGainControl');
      remap(constraints.audio, 'noiseSuppression', 'googNoiseSuppression');
      constraints.audio = constraintsToChrome_(constraints.audio);
    }
    if (constraints && typeof constraints.video === 'object') {
      // Shim facingMode for mobile & surface pro.
      var face = constraints.video.facingMode;
      face = face && ((typeof face === 'object') ? face : {ideal: face});
      var getSupportedFacingModeLies = browserDetails.version < 66;

      if ((face && (face.exact === 'user' || face.exact === 'environment' ||
                    face.ideal === 'user' || face.ideal === 'environment')) &&
          !(navigator.mediaDevices.getSupportedConstraints &&
            navigator.mediaDevices.getSupportedConstraints().facingMode &&
            !getSupportedFacingModeLies)) {
        delete constraints.video.facingMode;
        var matches;
        if (face.exact === 'environment' || face.ideal === 'environment') {
          matches = ['back', 'rear'];
        } else if (face.exact === 'user' || face.ideal === 'user') {
          matches = ['front'];
        }
        if (matches) {
          // Look for matches in label, or use last cam for back (typical).
          return navigator.mediaDevices.enumerateDevices()
          .then(function(devices) {
            devices = devices.filter(function(d) {
              return d.kind === 'videoinput';
            });
            var dev = devices.find(function(d) {
              return matches.some(function(match) {
                return d.label.toLowerCase().indexOf(match) !== -1;
              });
            });
            if (!dev && devices.length && matches.indexOf('back') !== -1) {
              dev = devices[devices.length - 1]; // more likely the back cam
            }
            if (dev) {
              constraints.video.deviceId = face.exact ? {exact: dev.deviceId} :
                                                        {ideal: dev.deviceId};
            }
            constraints.video = constraintsToChrome_(constraints.video);
            logging('chrome: ' + JSON.stringify(constraints));
            return func(constraints);
          });
        }
      }
      constraints.video = constraintsToChrome_(constraints.video);
    }
    logging('chrome: ' + JSON.stringify(constraints));
    return func(constraints);
  };

  var shimError_ = function(e) {
    return {
      name: {
        PermissionDeniedError: 'NotAllowedError',
        PermissionDismissedError: 'NotAllowedError',
        InvalidStateError: 'NotAllowedError',
        DevicesNotFoundError: 'NotFoundError',
        ConstraintNotSatisfiedError: 'OverconstrainedError',
        TrackStartError: 'NotReadableError',
        MediaDeviceFailedDueToShutdown: 'NotAllowedError',
        MediaDeviceKillSwitchOn: 'NotAllowedError',
        TabCaptureError: 'AbortError',
        ScreenCaptureError: 'AbortError',
        DeviceCaptureError: 'AbortError'
      }[e.name] || e.name,
      message: e.message,
      constraint: e.constraint || e.constraintName,
      toString: function() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

  var getUserMedia_ = function(constraints, onSuccess, onError) {
    shimConstraints_(constraints, function(c) {
      navigator.webkitGetUserMedia(c, onSuccess, function(e) {
        if (onError) {
          onError(shimError_(e));
        }
      });
    });
  };

  navigator.getUserMedia = getUserMedia_;

  // Returns the result of getUserMedia as a Promise.
  var getUserMediaPromise_ = function(constraints) {
    return new Promise(function(resolve, reject) {
      navigator.getUserMedia(constraints, resolve, reject);
    });
  };

  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {
      getUserMedia: getUserMediaPromise_,
      enumerateDevices: function() {
        return new Promise(function(resolve) {
          var kinds = {audio: 'audioinput', video: 'videoinput'};
          return window.MediaStreamTrack.getSources(function(devices) {
            resolve(devices.map(function(device) {
              return {label: device.label,
                kind: kinds[device.kind],
                deviceId: device.id,
                groupId: ''};
            }));
          });
        });
      },
      getSupportedConstraints: function() {
        return {
          deviceId: true, echoCancellation: true, facingMode: true,
          frameRate: true, height: true, width: true
        };
      }
    };
  }

  // A shim for getUserMedia method on the mediaDevices object.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (!navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return getUserMediaPromise_(constraints);
    };
  } else {
    // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
    // function which returns a Promise, it does not accept spec-style
    // constraints.
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(cs) {
      return shimConstraints_(cs, function(c) {
        return origGetUserMedia(c).then(function(stream) {
          if (c.audio && !stream.getAudioTracks().length ||
              c.video && !stream.getVideoTracks().length) {
            stream.getTracks().forEach(function(track) {
              track.stop();
            });
            throw new DOMException('', 'NotFoundError');
          }
          return stream;
        }, function(e) {
          return Promise.reject(shimError_(e));
        });
      });
    };
  }

  // Dummy devicechange event methods.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (typeof navigator.mediaDevices.addEventListener === 'undefined') {
    navigator.mediaDevices.addEventListener = function() {
      logging('Dummy mediaDevices.addEventListener called.');
    };
  }
  if (typeof navigator.mediaDevices.removeEventListener === 'undefined') {
    navigator.mediaDevices.removeEventListener = function() {
      logging('Dummy mediaDevices.removeEventListener called.');
    };
  }
};

},{"../utils.js":14}],7:[function(require,module,exports){
/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */


var SDPUtils = require('sdp');
var utils = require('./utils');

module.exports = {
  shimRTCIceCandidate: function(window) {
    // foundation is arbitrarily chosen as an indicator for full support for
    // https://w3c.github.io/webrtc-pc/#rtcicecandidate-interface
    if (!window.RTCIceCandidate || (window.RTCIceCandidate && 'foundation' in
        window.RTCIceCandidate.prototype)) {
      return;
    }

    var NativeRTCIceCandidate = window.RTCIceCandidate;
    window.RTCIceCandidate = function(args) {
      // Remove the a= which shouldn't be part of the candidate string.
      if (typeof args === 'object' && args.candidate &&
          args.candidate.indexOf('a=') === 0) {
        args = JSON.parse(JSON.stringify(args));
        args.candidate = args.candidate.substr(2);
      }

      if (args.candidate && args.candidate.length) {
        // Augment the native candidate with the parsed fields.
        var nativeCandidate = new NativeRTCIceCandidate(args);
        var parsedCandidate = SDPUtils.parseCandidate(args.candidate);
        var augmentedCandidate = Object.assign(nativeCandidate,
            parsedCandidate);

        // Add a serializer that does not serialize the extra attributes.
        augmentedCandidate.toJSON = function() {
          return {
            candidate: augmentedCandidate.candidate,
            sdpMid: augmentedCandidate.sdpMid,
            sdpMLineIndex: augmentedCandidate.sdpMLineIndex,
            usernameFragment: augmentedCandidate.usernameFragment,
          };
        };
        return augmentedCandidate;
      }
      return new NativeRTCIceCandidate(args);
    };
    window.RTCIceCandidate.prototype = NativeRTCIceCandidate.prototype;

    // Hook up the augmented candidate in onicecandidate and
    // addEventListener('icecandidate', ...)
    utils.wrapPeerConnectionEvent(window, 'icecandidate', function(e) {
      if (e.candidate) {
        Object.defineProperty(e, 'candidate', {
          value: new window.RTCIceCandidate(e.candidate),
          writable: 'false'
        });
      }
      return e;
    });
  },

  // shimCreateObjectURL must be called before shimSourceObject to avoid loop.

  shimCreateObjectURL: function(window) {
    var URL = window && window.URL;

    if (!(typeof window === 'object' && window.HTMLMediaElement &&
          'srcObject' in window.HTMLMediaElement.prototype &&
        URL.createObjectURL && URL.revokeObjectURL)) {
      // Only shim CreateObjectURL using srcObject if srcObject exists.
      return undefined;
    }

    var nativeCreateObjectURL = URL.createObjectURL.bind(URL);
    var nativeRevokeObjectURL = URL.revokeObjectURL.bind(URL);
    var streams = new Map(), newId = 0;

    URL.createObjectURL = function(stream) {
      if ('getTracks' in stream) {
        var url = 'polyblob:' + (++newId);
        streams.set(url, stream);
        utils.deprecated('URL.createObjectURL(stream)',
            'elem.srcObject = stream');
        return url;
      }
      return nativeCreateObjectURL(stream);
    };
    URL.revokeObjectURL = function(url) {
      nativeRevokeObjectURL(url);
      streams.delete(url);
    };

    var dsc = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype,
                                              'src');
    Object.defineProperty(window.HTMLMediaElement.prototype, 'src', {
      get: function() {
        return dsc.get.apply(this);
      },
      set: function(url) {
        this.srcObject = streams.get(url) || null;
        return dsc.set.apply(this, [url]);
      }
    });

    var nativeSetAttribute = window.HTMLMediaElement.prototype.setAttribute;
    window.HTMLMediaElement.prototype.setAttribute = function() {
      if (arguments.length === 2 &&
          ('' + arguments[0]).toLowerCase() === 'src') {
        this.srcObject = streams.get(arguments[1]) || null;
      }
      return nativeSetAttribute.apply(this, arguments);
    };
  },

  shimMaxMessageSize: function(window) {
    if (window.RTCSctpTransport || !window.RTCPeerConnection) {
      return;
    }
    var browserDetails = utils.detectBrowser(window);

    if (!('sctp' in window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'sctp', {
        get: function() {
          return typeof this._sctp === 'undefined' ? null : this._sctp;
        }
      });
    }

    var sctpInDescription = function(description) {
      var sections = SDPUtils.splitSections(description.sdp);
      sections.shift();
      return sections.some(function(mediaSection) {
        var mLine = SDPUtils.parseMLine(mediaSection);
        return mLine && mLine.kind === 'application'
            && mLine.protocol.indexOf('SCTP') !== -1;
      });
    };

    var getRemoteFirefoxVersion = function(description) {
      // TODO: Is there a better solution for detecting Firefox?
      var match = description.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);
      if (match === null || match.length < 2) {
        return -1;
      }
      var version = parseInt(match[1], 10);
      // Test for NaN (yes, this is ugly)
      return version !== version ? -1 : version;
    };

    var getCanSendMaxMessageSize = function(remoteIsFirefox) {
      // Every implementation we know can send at least 64 KiB.
      // Note: Although Chrome is technically able to send up to 256 KiB, the
      //       data does not reach the other peer reliably.
      //       See: https://bugs.chromium.org/p/webrtc/issues/detail?id=8419
      var canSendMaxMessageSize = 65536;
      if (browserDetails.browser === 'firefox') {
        if (browserDetails.version < 57) {
          if (remoteIsFirefox === -1) {
            // FF < 57 will send in 16 KiB chunks using the deprecated PPID
            // fragmentation.
            canSendMaxMessageSize = 16384;
          } else {
            // However, other FF (and RAWRTC) can reassemble PPID-fragmented
            // messages. Thus, supporting ~2 GiB when sending.
            canSendMaxMessageSize = 2147483637;
          }
        } else if (browserDetails.version < 60) {
          // Currently, all FF >= 57 will reset the remote maximum message size
          // to the default value when a data channel is created at a later
          // stage. :(
          // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1426831
          canSendMaxMessageSize =
            browserDetails.version === 57 ? 65535 : 65536;
        } else {
          // FF >= 60 supports sending ~2 GiB
          canSendMaxMessageSize = 2147483637;
        }
      }
      return canSendMaxMessageSize;
    };

    var getMaxMessageSize = function(description, remoteIsFirefox) {
      // Note: 65536 bytes is the default value from the SDP spec. Also,
      //       every implementation we know supports receiving 65536 bytes.
      var maxMessageSize = 65536;

      // FF 57 has a slightly incorrect default remote max message size, so
      // we need to adjust it here to avoid a failure when sending.
      // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1425697
      if (browserDetails.browser === 'firefox'
           && browserDetails.version === 57) {
        maxMessageSize = 65535;
      }

      var match = SDPUtils.matchPrefix(description.sdp, 'a=max-message-size:');
      if (match.length > 0) {
        maxMessageSize = parseInt(match[0].substr(19), 10);
      } else if (browserDetails.browser === 'firefox' &&
                  remoteIsFirefox !== -1) {
        // If the maximum message size is not present in the remote SDP and
        // both local and remote are Firefox, the remote peer can receive
        // ~2 GiB.
        maxMessageSize = 2147483637;
      }
      return maxMessageSize;
    };

    var origSetRemoteDescription =
        window.RTCPeerConnection.prototype.setRemoteDescription;
    window.RTCPeerConnection.prototype.setRemoteDescription = function() {
      var pc = this;
      pc._sctp = null;

      if (sctpInDescription(arguments[0])) {
        // Check if the remote is FF.
        var isFirefox = getRemoteFirefoxVersion(arguments[0]);

        // Get the maximum message size the local peer is capable of sending
        var canSendMMS = getCanSendMaxMessageSize(isFirefox);

        // Get the maximum message size of the remote peer.
        var remoteMMS = getMaxMessageSize(arguments[0], isFirefox);

        // Determine final maximum message size
        var maxMessageSize;
        if (canSendMMS === 0 && remoteMMS === 0) {
          maxMessageSize = Number.POSITIVE_INFINITY;
        } else if (canSendMMS === 0 || remoteMMS === 0) {
          maxMessageSize = Math.max(canSendMMS, remoteMMS);
        } else {
          maxMessageSize = Math.min(canSendMMS, remoteMMS);
        }

        // Create a dummy RTCSctpTransport object and the 'maxMessageSize'
        // attribute.
        var sctp = {};
        Object.defineProperty(sctp, 'maxMessageSize', {
          get: function() {
            return maxMessageSize;
          }
        });
        pc._sctp = sctp;
      }

      return origSetRemoteDescription.apply(pc, arguments);
    };
  },

  shimSendThrowTypeError: function(window) {
    if (!(window.RTCPeerConnection &&
        'createDataChannel' in window.RTCPeerConnection.prototype)) {
      return;
    }

    // Note: Although Firefox >= 57 has a native implementation, the maximum
    //       message size can be reset for all data channels at a later stage.
    //       See: https://bugzilla.mozilla.org/show_bug.cgi?id=1426831

    function wrapDcSend(dc, pc) {
      var origDataChannelSend = dc.send;
      dc.send = function() {
        var data = arguments[0];
        var length = data.length || data.size || data.byteLength;
        if (dc.readyState === 'open' &&
            pc.sctp && length > pc.sctp.maxMessageSize) {
          throw new TypeError('Message too large (can send a maximum of ' +
            pc.sctp.maxMessageSize + ' bytes)');
        }
        return origDataChannelSend.apply(dc, arguments);
      };
    }
    var origCreateDataChannel =
      window.RTCPeerConnection.prototype.createDataChannel;
    window.RTCPeerConnection.prototype.createDataChannel = function() {
      var pc = this;
      var dataChannel = origCreateDataChannel.apply(pc, arguments);
      wrapDcSend(dataChannel, pc);
      return dataChannel;
    };
    utils.wrapPeerConnectionEvent(window, 'datachannel', function(e) {
      wrapDcSend(e.channel, e.target);
      return e;
    });
  }
};

},{"./utils":14,"sdp":2}],8:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */


var utils = require('../utils');
var filterIceServers = require('./filtericeservers');
var shimRTCPeerConnection = require('rtcpeerconnection-shim');

module.exports = {
  shimGetUserMedia: require('./getusermedia'),
  shimPeerConnection: function(window) {
    var browserDetails = utils.detectBrowser(window);

    if (window.RTCIceGatherer) {
      if (!window.RTCIceCandidate) {
        window.RTCIceCandidate = function(args) {
          return args;
        };
      }
      if (!window.RTCSessionDescription) {
        window.RTCSessionDescription = function(args) {
          return args;
        };
      }
      // this adds an additional event listener to MediaStrackTrack that signals
      // when a tracks enabled property was changed. Workaround for a bug in
      // addStream, see below. No longer required in 15025+
      if (browserDetails.version < 15025) {
        var origMSTEnabled = Object.getOwnPropertyDescriptor(
            window.MediaStreamTrack.prototype, 'enabled');
        Object.defineProperty(window.MediaStreamTrack.prototype, 'enabled', {
          set: function(value) {
            origMSTEnabled.set.call(this, value);
            var ev = new Event('enabled');
            ev.enabled = value;
            this.dispatchEvent(ev);
          }
        });
      }
    }

    // ORTC defines the DTMF sender a bit different.
    // https://github.com/w3c/ortc/issues/714
    if (window.RTCRtpSender && !('dtmf' in window.RTCRtpSender.prototype)) {
      Object.defineProperty(window.RTCRtpSender.prototype, 'dtmf', {
        get: function() {
          if (this._dtmf === undefined) {
            if (this.track.kind === 'audio') {
              this._dtmf = new window.RTCDtmfSender(this);
            } else if (this.track.kind === 'video') {
              this._dtmf = null;
            }
          }
          return this._dtmf;
        }
      });
    }
    // Edge currently only implements the RTCDtmfSender, not the
    // RTCDTMFSender alias. See http://draft.ortc.org/#rtcdtmfsender2*
    if (window.RTCDtmfSender && !window.RTCDTMFSender) {
      window.RTCDTMFSender = window.RTCDtmfSender;
    }

    var RTCPeerConnectionShim = shimRTCPeerConnection(window,
        browserDetails.version);
    window.RTCPeerConnection = function(config) {
      if (config && config.iceServers) {
        config.iceServers = filterIceServers(config.iceServers);
      }
      return new RTCPeerConnectionShim(config);
    };
    window.RTCPeerConnection.prototype = RTCPeerConnectionShim.prototype;
  },
  shimReplaceTrack: function(window) {
    // ORTC has replaceTrack -- https://github.com/w3c/ortc/issues/614
    if (window.RTCRtpSender &&
        !('replaceTrack' in window.RTCRtpSender.prototype)) {
      window.RTCRtpSender.prototype.replaceTrack =
          window.RTCRtpSender.prototype.setTrack;
    }
  }
};

},{"../utils":14,"./filtericeservers":9,"./getusermedia":10,"rtcpeerconnection-shim":1}],9:[function(require,module,exports){
/*
 *  Copyright (c) 2018 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */


var utils = require('../utils');
// Edge does not like
// 1) stun: filtered after 14393 unless ?transport=udp is present
// 2) turn: that does not have all of turn:host:port?transport=udp
// 3) turn: with ipv6 addresses
// 4) turn: occurring muliple times
module.exports = function(iceServers, edgeVersion) {
  var hasTurn = false;
  iceServers = JSON.parse(JSON.stringify(iceServers));
  return iceServers.filter(function(server) {
    if (server && (server.urls || server.url)) {
      var urls = server.urls || server.url;
      if (server.url && !server.urls) {
        utils.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
      }
      var isString = typeof urls === 'string';
      if (isString) {
        urls = [urls];
      }
      urls = urls.filter(function(url) {
        var validTurn = url.indexOf('turn:') === 0 &&
            url.indexOf('transport=udp') !== -1 &&
            url.indexOf('turn:[') === -1 &&
            !hasTurn;

        if (validTurn) {
          hasTurn = true;
          return true;
        }
        return url.indexOf('stun:') === 0 && edgeVersion >= 14393 &&
            url.indexOf('?transport=udp') === -1;
      });

      delete server.url;
      server.urls = isString ? urls[0] : urls;
      return !!urls.length;
    }
  });
};

},{"../utils":14}],10:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */


// Expose public methods.
module.exports = function(window) {
  var navigator = window && window.navigator;

  var shimError_ = function(e) {
    return {
      name: {PermissionDeniedError: 'NotAllowedError'}[e.name] || e.name,
      message: e.message,
      constraint: e.constraint,
      toString: function() {
        return this.name;
      }
    };
  };

  // getUserMedia error shim.
  var origGetUserMedia = navigator.mediaDevices.getUserMedia.
      bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = function(c) {
    return origGetUserMedia(c).catch(function(e) {
      return Promise.reject(shimError_(e));
    });
  };
};

},{}],11:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */


var utils = require('../utils');

module.exports = {
  shimGetUserMedia: require('./getusermedia'),
  shimOnTrack: function(window) {
    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
        window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
        get: function() {
          return this._ontrack;
        },
        set: function(f) {
          if (this._ontrack) {
            this.removeEventListener('track', this._ontrack);
            this.removeEventListener('addstream', this._ontrackpoly);
          }
          this.addEventListener('track', this._ontrack = f);
          this.addEventListener('addstream', this._ontrackpoly = function(e) {
            e.stream.getTracks().forEach(function(track) {
              var event = new Event('track');
              event.track = track;
              event.receiver = {track: track};
              event.transceiver = {receiver: event.receiver};
              event.streams = [e.stream];
              this.dispatchEvent(event);
            }.bind(this));
          }.bind(this));
        }
      });
    }
    if (typeof window === 'object' && window.RTCTrackEvent &&
        ('receiver' in window.RTCTrackEvent.prototype) &&
        !('transceiver' in window.RTCTrackEvent.prototype)) {
      Object.defineProperty(window.RTCTrackEvent.prototype, 'transceiver', {
        get: function() {
          return {receiver: this.receiver};
        }
      });
    }
  },

  shimSourceObject: function(window) {
    // Firefox has supported mozSrcObject since FF22, unprefixed in 42.
    if (typeof window === 'object') {
      if (window.HTMLMediaElement &&
        !('srcObject' in window.HTMLMediaElement.prototype)) {
        // Shim the srcObject property, once, when HTMLMediaElement is found.
        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
          get: function() {
            return this.mozSrcObject;
          },
          set: function(stream) {
            this.mozSrcObject = stream;
          }
        });
      }
    }
  },

  shimPeerConnection: function(window) {
    var browserDetails = utils.detectBrowser(window);

    if (typeof window !== 'object' || !(window.RTCPeerConnection ||
        window.mozRTCPeerConnection)) {
      return; // probably media.peerconnection.enabled=false in about:config
    }
    // The RTCPeerConnection object.
    if (!window.RTCPeerConnection) {
      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
        if (browserDetails.version < 38) {
          // .urls is not supported in FF < 38.
          // create RTCIceServers with a single url.
          if (pcConfig && pcConfig.iceServers) {
            var newIceServers = [];
            for (var i = 0; i < pcConfig.iceServers.length; i++) {
              var server = pcConfig.iceServers[i];
              if (server.hasOwnProperty('urls')) {
                for (var j = 0; j < server.urls.length; j++) {
                  var newServer = {
                    url: server.urls[j]
                  };
                  if (server.urls[j].indexOf('turn') === 0) {
                    newServer.username = server.username;
                    newServer.credential = server.credential;
                  }
                  newIceServers.push(newServer);
                }
              } else {
                newIceServers.push(pcConfig.iceServers[i]);
              }
            }
            pcConfig.iceServers = newIceServers;
          }
        }
        return new window.mozRTCPeerConnection(pcConfig, pcConstraints);
      };
      window.RTCPeerConnection.prototype =
          window.mozRTCPeerConnection.prototype;

      // wrap static methods. Currently just generateCertificate.
      if (window.mozRTCPeerConnection.generateCertificate) {
        Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
          get: function() {
            return window.mozRTCPeerConnection.generateCertificate;
          }
        });
      }

      window.RTCSessionDescription = window.mozRTCSessionDescription;
      window.RTCIceCandidate = window.mozRTCIceCandidate;
    }

    // shim away need for obsolete RTCIceCandidate/RTCSessionDescription.
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          var nativeMethod = window.RTCPeerConnection.prototype[method];
          window.RTCPeerConnection.prototype[method] = function() {
            arguments[0] = new ((method === 'addIceCandidate') ?
                window.RTCIceCandidate :
                window.RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          };
        });

    // support for addIceCandidate(null or undefined)
    var nativeAddIceCandidate =
        window.RTCPeerConnection.prototype.addIceCandidate;
    window.RTCPeerConnection.prototype.addIceCandidate = function() {
      if (!arguments[0]) {
        if (arguments[1]) {
          arguments[1].apply(null);
        }
        return Promise.resolve();
      }
      return nativeAddIceCandidate.apply(this, arguments);
    };

    // shim getStats with maplike support
    var makeMapStats = function(stats) {
      var map = new Map();
      Object.keys(stats).forEach(function(key) {
        map.set(key, stats[key]);
        map[key] = stats[key];
      });
      return map;
    };

    var modernStatsTypes = {
      inboundrtp: 'inbound-rtp',
      outboundrtp: 'outbound-rtp',
      candidatepair: 'candidate-pair',
      localcandidate: 'local-candidate',
      remotecandidate: 'remote-candidate'
    };

    var nativeGetStats = window.RTCPeerConnection.prototype.getStats;
    window.RTCPeerConnection.prototype.getStats = function(
      selector,
      onSucc,
      onErr
    ) {
      return nativeGetStats.apply(this, [selector || null])
        .then(function(stats) {
          if (browserDetails.version < 48) {
            stats = makeMapStats(stats);
          }
          if (browserDetails.version < 53 && !onSucc) {
            // Shim only promise getStats with spec-hyphens in type names
            // Leave callback version alone; misc old uses of forEach before Map
            try {
              stats.forEach(function(stat) {
                stat.type = modernStatsTypes[stat.type] || stat.type;
              });
            } catch (e) {
              if (e.name !== 'TypeError') {
                throw e;
              }
              // Avoid TypeError: "type" is read-only, in old versions. 34-43ish
              stats.forEach(function(stat, i) {
                stats.set(i, Object.assign({}, stat, {
                  type: modernStatsTypes[stat.type] || stat.type
                }));
              });
            }
          }
          return stats;
        })
        .then(onSucc, onErr);
    };
  },

  shimSenderGetStats: function(window) {
    if (!(typeof window === 'object' && window.RTCPeerConnection &&
        window.RTCRtpSender)) {
      return;
    }
    if (window.RTCRtpSender && 'getStats' in window.RTCRtpSender.prototype) {
      return;
    }
    var origGetSenders = window.RTCPeerConnection.prototype.getSenders;
    if (origGetSenders) {
      window.RTCPeerConnection.prototype.getSenders = function() {
        var pc = this;
        var senders = origGetSenders.apply(pc, []);
        senders.forEach(function(sender) {
          sender._pc = pc;
        });
        return senders;
      };
    }

    var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
    if (origAddTrack) {
      window.RTCPeerConnection.prototype.addTrack = function() {
        var sender = origAddTrack.apply(this, arguments);
        sender._pc = this;
        return sender;
      };
    }
    window.RTCRtpSender.prototype.getStats = function() {
      return this.track ? this._pc.getStats(this.track) :
          Promise.resolve(new Map());
    };
  },

  shimReceiverGetStats: function(window) {
    if (!(typeof window === 'object' && window.RTCPeerConnection &&
        window.RTCRtpSender)) {
      return;
    }
    if (window.RTCRtpSender && 'getStats' in window.RTCRtpReceiver.prototype) {
      return;
    }
    var origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;
    if (origGetReceivers) {
      window.RTCPeerConnection.prototype.getReceivers = function() {
        var pc = this;
        var receivers = origGetReceivers.apply(pc, []);
        receivers.forEach(function(receiver) {
          receiver._pc = pc;
        });
        return receivers;
      };
    }
    utils.wrapPeerConnectionEvent(window, 'track', function(e) {
      e.receiver._pc = e.srcElement;
      return e;
    });
    window.RTCRtpReceiver.prototype.getStats = function() {
      return this._pc.getStats(this.track);
    };
  },

  shimRemoveStream: function(window) {
    if (!window.RTCPeerConnection ||
        'removeStream' in window.RTCPeerConnection.prototype) {
      return;
    }
    window.RTCPeerConnection.prototype.removeStream = function(stream) {
      var pc = this;
      utils.deprecated('removeStream', 'removeTrack');
      this.getSenders().forEach(function(sender) {
        if (sender.track && stream.getTracks().indexOf(sender.track) !== -1) {
          pc.removeTrack(sender);
        }
      });
    };
  },

  shimRTCDataChannel: function(window) {
    // rename DataChannel to RTCDataChannel (native fix in FF60):
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1173851
    if (window.DataChannel && !window.RTCDataChannel) {
      window.RTCDataChannel = window.DataChannel;
    }
  },

  shimGetDisplayMedia: function(window, preferredMediaSource) {
    if ('getDisplayMedia' in window.navigator) {
      return;
    }
    navigator.getDisplayMedia = function(constraints) {
      if (!(constraints && constraints.video)) {
        var err = new DOMException('getDisplayMedia without video ' +
            'constraints is undefined');
        err.name = 'NotFoundError';
        // from https://heycam.github.io/webidl/#idl-DOMException-error-names
        err.code = 8;
        return Promise.reject(err);
      }
      if (constraints.video === true) {
        constraints.video = {mediaSource: preferredMediaSource};
      } else {
        constraints.video.mediaSource = preferredMediaSource;
      }
      return navigator.mediaDevices.getUserMedia(constraints);
    };
  }
};

},{"../utils":14,"./getusermedia":12}],12:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */


var utils = require('../utils');
var logging = utils.log;

// Expose public methods.
module.exports = function(window) {
  var browserDetails = utils.detectBrowser(window);
  var navigator = window && window.navigator;
  var MediaStreamTrack = window && window.MediaStreamTrack;

  var shimError_ = function(e) {
    return {
      name: {
        InternalError: 'NotReadableError',
        NotSupportedError: 'TypeError',
        PermissionDeniedError: 'NotAllowedError',
        SecurityError: 'NotAllowedError'
      }[e.name] || e.name,
      message: {
        'The operation is insecure.': 'The request is not allowed by the ' +
        'user agent or the platform in the current context.'
      }[e.message] || e.message,
      constraint: e.constraint,
      toString: function() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

  // getUserMedia constraints shim.
  var getUserMedia_ = function(constraints, onSuccess, onError) {
    var constraintsToFF37_ = function(c) {
      if (typeof c !== 'object' || c.require) {
        return c;
      }
      var require = [];
      Object.keys(c).forEach(function(key) {
        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
          return;
        }
        var r = c[key] = (typeof c[key] === 'object') ?
            c[key] : {ideal: c[key]};
        if (r.min !== undefined ||
            r.max !== undefined || r.exact !== undefined) {
          require.push(key);
        }
        if (r.exact !== undefined) {
          if (typeof r.exact === 'number') {
            r. min = r.max = r.exact;
          } else {
            c[key] = r.exact;
          }
          delete r.exact;
        }
        if (r.ideal !== undefined) {
          c.advanced = c.advanced || [];
          var oc = {};
          if (typeof r.ideal === 'number') {
            oc[key] = {min: r.ideal, max: r.ideal};
          } else {
            oc[key] = r.ideal;
          }
          c.advanced.push(oc);
          delete r.ideal;
          if (!Object.keys(r).length) {
            delete c[key];
          }
        }
      });
      if (require.length) {
        c.require = require;
      }
      return c;
    };
    constraints = JSON.parse(JSON.stringify(constraints));
    if (browserDetails.version < 38) {
      logging('spec: ' + JSON.stringify(constraints));
      if (constraints.audio) {
        constraints.audio = constraintsToFF37_(constraints.audio);
      }
      if (constraints.video) {
        constraints.video = constraintsToFF37_(constraints.video);
      }
      logging('ff37: ' + JSON.stringify(constraints));
    }
    return navigator.mozGetUserMedia(constraints, onSuccess, function(e) {
      onError(shimError_(e));
    });
  };

  // Returns the result of getUserMedia as a Promise.
  var getUserMediaPromise_ = function(constraints) {
    return new Promise(function(resolve, reject) {
      getUserMedia_(constraints, resolve, reject);
    });
  };

  // Shim for mediaDevices on older versions.
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {getUserMedia: getUserMediaPromise_,
      addEventListener: function() { },
      removeEventListener: function() { }
    };
  }
  navigator.mediaDevices.enumerateDevices =
      navigator.mediaDevices.enumerateDevices || function() {
        return new Promise(function(resolve) {
          var infos = [
            {kind: 'audioinput', deviceId: 'default', label: '', groupId: ''},
            {kind: 'videoinput', deviceId: 'default', label: '', groupId: ''}
          ];
          resolve(infos);
        });
      };

  if (browserDetails.version < 41) {
    // Work around http://bugzil.la/1169665
    var orgEnumerateDevices =
        navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
    navigator.mediaDevices.enumerateDevices = function() {
      return orgEnumerateDevices().then(undefined, function(e) {
        if (e.name === 'NotFoundError') {
          return [];
        }
        throw e;
      });
    };
  }
  if (browserDetails.version < 49) {
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(c) {
      return origGetUserMedia(c).then(function(stream) {
        // Work around https://bugzil.la/802326
        if (c.audio && !stream.getAudioTracks().length ||
            c.video && !stream.getVideoTracks().length) {
          stream.getTracks().forEach(function(track) {
            track.stop();
          });
          throw new DOMException('The object can not be found here.',
                                 'NotFoundError');
        }
        return stream;
      }, function(e) {
        return Promise.reject(shimError_(e));
      });
    };
  }
  if (!(browserDetails.version > 55 &&
      'autoGainControl' in navigator.mediaDevices.getSupportedConstraints())) {
    var remap = function(obj, a, b) {
      if (a in obj && !(b in obj)) {
        obj[b] = obj[a];
        delete obj[a];
      }
    };

    var nativeGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(c) {
      if (typeof c === 'object' && typeof c.audio === 'object') {
        c = JSON.parse(JSON.stringify(c));
        remap(c.audio, 'autoGainControl', 'mozAutoGainControl');
        remap(c.audio, 'noiseSuppression', 'mozNoiseSuppression');
      }
      return nativeGetUserMedia(c);
    };

    if (MediaStreamTrack && MediaStreamTrack.prototype.getSettings) {
      var nativeGetSettings = MediaStreamTrack.prototype.getSettings;
      MediaStreamTrack.prototype.getSettings = function() {
        var obj = nativeGetSettings.apply(this, arguments);
        remap(obj, 'mozAutoGainControl', 'autoGainControl');
        remap(obj, 'mozNoiseSuppression', 'noiseSuppression');
        return obj;
      };
    }

    if (MediaStreamTrack && MediaStreamTrack.prototype.applyConstraints) {
      var nativeApplyConstraints = MediaStreamTrack.prototype.applyConstraints;
      MediaStreamTrack.prototype.applyConstraints = function(c) {
        if (this.kind === 'audio' && typeof c === 'object') {
          c = JSON.parse(JSON.stringify(c));
          remap(c, 'autoGainControl', 'mozAutoGainControl');
          remap(c, 'noiseSuppression', 'mozNoiseSuppression');
        }
        return nativeApplyConstraints.apply(this, [c]);
      };
    }
  }
  navigator.getUserMedia = function(constraints, onSuccess, onError) {
    if (browserDetails.version < 44) {
      return getUserMedia_(constraints, onSuccess, onError);
    }
    // Replace Firefox 44+'s deprecation warning with unprefixed version.
    utils.deprecated('navigator.getUserMedia',
        'navigator.mediaDevices.getUserMedia');
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
  };
};

},{"../utils":14}],13:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

var utils = require('../utils');

module.exports = {
  shimLocalStreamsAPI: function(window) {
    if (typeof window !== 'object' || !window.RTCPeerConnection) {
      return;
    }
    if (!('getLocalStreams' in window.RTCPeerConnection.prototype)) {
      window.RTCPeerConnection.prototype.getLocalStreams = function() {
        if (!this._localStreams) {
          this._localStreams = [];
        }
        return this._localStreams;
      };
    }
    if (!('getStreamById' in window.RTCPeerConnection.prototype)) {
      window.RTCPeerConnection.prototype.getStreamById = function(id) {
        var result = null;
        if (this._localStreams) {
          this._localStreams.forEach(function(stream) {
            if (stream.id === id) {
              result = stream;
            }
          });
        }
        if (this._remoteStreams) {
          this._remoteStreams.forEach(function(stream) {
            if (stream.id === id) {
              result = stream;
            }
          });
        }
        return result;
      };
    }
    if (!('addStream' in window.RTCPeerConnection.prototype)) {
      var _addTrack = window.RTCPeerConnection.prototype.addTrack;
      window.RTCPeerConnection.prototype.addStream = function(stream) {
        if (!this._localStreams) {
          this._localStreams = [];
        }
        if (this._localStreams.indexOf(stream) === -1) {
          this._localStreams.push(stream);
        }
        var pc = this;
        stream.getTracks().forEach(function(track) {
          _addTrack.call(pc, track, stream);
        });
      };

      window.RTCPeerConnection.prototype.addTrack = function(track, stream) {
        if (stream) {
          if (!this._localStreams) {
            this._localStreams = [stream];
          } else if (this._localStreams.indexOf(stream) === -1) {
            this._localStreams.push(stream);
          }
        }
        return _addTrack.call(this, track, stream);
      };
    }
    if (!('removeStream' in window.RTCPeerConnection.prototype)) {
      window.RTCPeerConnection.prototype.removeStream = function(stream) {
        if (!this._localStreams) {
          this._localStreams = [];
        }
        var index = this._localStreams.indexOf(stream);
        if (index === -1) {
          return;
        }
        this._localStreams.splice(index, 1);
        var pc = this;
        var tracks = stream.getTracks();
        this.getSenders().forEach(function(sender) {
          if (tracks.indexOf(sender.track) !== -1) {
            pc.removeTrack(sender);
          }
        });
      };
    }
  },
  shimRemoteStreamsAPI: function(window) {
    if (typeof window !== 'object' || !window.RTCPeerConnection) {
      return;
    }
    if (!('getRemoteStreams' in window.RTCPeerConnection.prototype)) {
      window.RTCPeerConnection.prototype.getRemoteStreams = function() {
        return this._remoteStreams ? this._remoteStreams : [];
      };
    }
    if (!('onaddstream' in window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'onaddstream', {
        get: function() {
          return this._onaddstream;
        },
        set: function(f) {
          var pc = this;
          if (this._onaddstream) {
            this.removeEventListener('addstream', this._onaddstream);
            this.removeEventListener('track', this._onaddstreampoly);
          }
          this.addEventListener('addstream', this._onaddstream = f);
          this.addEventListener('track', this._onaddstreampoly = function(e) {
            e.streams.forEach(function(stream) {
              if (!pc._remoteStreams) {
                pc._remoteStreams = [];
              }
              if (pc._remoteStreams.indexOf(stream) >= 0) {
                return;
              }
              pc._remoteStreams.push(stream);
              var event = new Event('addstream');
              event.stream = stream;
              pc.dispatchEvent(event);
            });
          });
        }
      });
    }
  },
  shimCallbacksAPI: function(window) {
    if (typeof window !== 'object' || !window.RTCPeerConnection) {
      return;
    }
    var prototype = window.RTCPeerConnection.prototype;
    var createOffer = prototype.createOffer;
    var createAnswer = prototype.createAnswer;
    var setLocalDescription = prototype.setLocalDescription;
    var setRemoteDescription = prototype.setRemoteDescription;
    var addIceCandidate = prototype.addIceCandidate;

    prototype.createOffer = function(successCallback, failureCallback) {
      var options = (arguments.length >= 2) ? arguments[2] : arguments[0];
      var promise = createOffer.apply(this, [options]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };

    prototype.createAnswer = function(successCallback, failureCallback) {
      var options = (arguments.length >= 2) ? arguments[2] : arguments[0];
      var promise = createAnswer.apply(this, [options]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };

    var withCallback = function(description, successCallback, failureCallback) {
      var promise = setLocalDescription.apply(this, [description]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.setLocalDescription = withCallback;

    withCallback = function(description, successCallback, failureCallback) {
      var promise = setRemoteDescription.apply(this, [description]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.setRemoteDescription = withCallback;

    withCallback = function(candidate, successCallback, failureCallback) {
      var promise = addIceCandidate.apply(this, [candidate]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.addIceCandidate = withCallback;
  },
  shimGetUserMedia: function(window) {
    var navigator = window && window.navigator;

    if (!navigator.getUserMedia) {
      if (navigator.webkitGetUserMedia) {
        navigator.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
      } else if (navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia) {
        navigator.getUserMedia = function(constraints, cb, errcb) {
          navigator.mediaDevices.getUserMedia(constraints)
          .then(cb, errcb);
        }.bind(navigator);
      }
    }
  },
  shimRTCIceServerUrls: function(window) {
    // migrate from non-spec RTCIceServer.url to RTCIceServer.urls
    var OrigPeerConnection = window.RTCPeerConnection;
    window.RTCPeerConnection = function(pcConfig, pcConstraints) {
      if (pcConfig && pcConfig.iceServers) {
        var newIceServers = [];
        for (var i = 0; i < pcConfig.iceServers.length; i++) {
          var server = pcConfig.iceServers[i];
          if (!server.hasOwnProperty('urls') &&
              server.hasOwnProperty('url')) {
            utils.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
            server = JSON.parse(JSON.stringify(server));
            server.urls = server.url;
            delete server.url;
            newIceServers.push(server);
          } else {
            newIceServers.push(pcConfig.iceServers[i]);
          }
        }
        pcConfig.iceServers = newIceServers;
      }
      return new OrigPeerConnection(pcConfig, pcConstraints);
    };
    window.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
    // wrap static methods. Currently just generateCertificate.
    if ('generateCertificate' in window.RTCPeerConnection) {
      Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
        get: function() {
          return OrigPeerConnection.generateCertificate;
        }
      });
    }
  },
  shimTrackEventTransceiver: function(window) {
    // Add event.transceiver member over deprecated event.receiver
    if (typeof window === 'object' && window.RTCPeerConnection &&
        ('receiver' in window.RTCTrackEvent.prototype) &&
        // can't check 'transceiver' in window.RTCTrackEvent.prototype, as it is
        // defined for some reason even when window.RTCTransceiver is not.
        !window.RTCTransceiver) {
      Object.defineProperty(window.RTCTrackEvent.prototype, 'transceiver', {
        get: function() {
          return {receiver: this.receiver};
        }
      });
    }
  },

  shimCreateOfferLegacy: function(window) {
    var origCreateOffer = window.RTCPeerConnection.prototype.createOffer;
    window.RTCPeerConnection.prototype.createOffer = function(offerOptions) {
      var pc = this;
      if (offerOptions) {
        if (typeof offerOptions.offerToReceiveAudio !== 'undefined') {
          // support bit values
          offerOptions.offerToReceiveAudio = !!offerOptions.offerToReceiveAudio;
        }
        var audioTransceiver = pc.getTransceivers().find(function(transceiver) {
          return transceiver.sender.track &&
              transceiver.sender.track.kind === 'audio';
        });
        if (offerOptions.offerToReceiveAudio === false && audioTransceiver) {
          if (audioTransceiver.direction === 'sendrecv') {
            if (audioTransceiver.setDirection) {
              audioTransceiver.setDirection('sendonly');
            } else {
              audioTransceiver.direction = 'sendonly';
            }
          } else if (audioTransceiver.direction === 'recvonly') {
            if (audioTransceiver.setDirection) {
              audioTransceiver.setDirection('inactive');
            } else {
              audioTransceiver.direction = 'inactive';
            }
          }
        } else if (offerOptions.offerToReceiveAudio === true &&
            !audioTransceiver) {
          pc.addTransceiver('audio');
        }


        if (typeof offerOptions.offerToReceiveAudio !== 'undefined') {
          // support bit values
          offerOptions.offerToReceiveVideo = !!offerOptions.offerToReceiveVideo;
        }
        var videoTransceiver = pc.getTransceivers().find(function(transceiver) {
          return transceiver.sender.track &&
              transceiver.sender.track.kind === 'video';
        });
        if (offerOptions.offerToReceiveVideo === false && videoTransceiver) {
          if (videoTransceiver.direction === 'sendrecv') {
            videoTransceiver.setDirection('sendonly');
          } else if (videoTransceiver.direction === 'recvonly') {
            videoTransceiver.setDirection('inactive');
          }
        } else if (offerOptions.offerToReceiveVideo === true &&
            !videoTransceiver) {
          pc.addTransceiver('video');
        }
      }
      return origCreateOffer.apply(pc, arguments);
    };
  }
};

},{"../utils":14}],14:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */


var logDisabled_ = true;
var deprecationWarnings_ = true;

/**
 * Extract browser version out of the provided user agent string.
 *
 * @param {!string} uastring userAgent string.
 * @param {!string} expr Regular expression used as match criteria.
 * @param {!number} pos position in the version string to be returned.
 * @return {!number} browser version.
 */
function extractVersion(uastring, expr, pos) {
  var match = uastring.match(expr);
  return match && match.length >= pos && parseInt(match[pos], 10);
}

// Wraps the peerconnection event eventNameToWrap in a function
// which returns the modified event object (or false to prevent
// the event).
function wrapPeerConnectionEvent(window, eventNameToWrap, wrapper) {
  if (!window.RTCPeerConnection) {
    return;
  }
  var proto = window.RTCPeerConnection.prototype;
  var nativeAddEventListener = proto.addEventListener;
  proto.addEventListener = function(nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap) {
      return nativeAddEventListener.apply(this, arguments);
    }
    var wrappedCallback = function(e) {
      var modifiedEvent = wrapper(e);
      if (modifiedEvent) {
        cb(modifiedEvent);
      }
    };
    this._eventMap = this._eventMap || {};
    this._eventMap[cb] = wrappedCallback;
    return nativeAddEventListener.apply(this, [nativeEventName,
      wrappedCallback]);
  };

  var nativeRemoveEventListener = proto.removeEventListener;
  proto.removeEventListener = function(nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap || !this._eventMap
        || !this._eventMap[cb]) {
      return nativeRemoveEventListener.apply(this, arguments);
    }
    var unwrappedCb = this._eventMap[cb];
    delete this._eventMap[cb];
    return nativeRemoveEventListener.apply(this, [nativeEventName,
      unwrappedCb]);
  };

  Object.defineProperty(proto, 'on' + eventNameToWrap, {
    get: function() {
      return this['_on' + eventNameToWrap];
    },
    set: function(cb) {
      if (this['_on' + eventNameToWrap]) {
        this.removeEventListener(eventNameToWrap,
            this['_on' + eventNameToWrap]);
        delete this['_on' + eventNameToWrap];
      }
      if (cb) {
        this.addEventListener(eventNameToWrap,
            this['_on' + eventNameToWrap] = cb);
      }
    },
    enumerable: true,
    configurable: true
  });
}

// Utility methods.
module.exports = {
  extractVersion: extractVersion,
  wrapPeerConnectionEvent: wrapPeerConnectionEvent,
  disableLog: function(bool) {
    if (typeof bool !== 'boolean') {
      return new Error('Argument type: ' + typeof bool +
          '. Please use a boolean.');
    }
    logDisabled_ = bool;
    return (bool) ? 'adapter.js logging disabled' :
        'adapter.js logging enabled';
  },

  /**
   * Disable or enable deprecation warnings
   * @param {!boolean} bool set to true to disable warnings.
   */
  disableWarnings: function(bool) {
    if (typeof bool !== 'boolean') {
      return new Error('Argument type: ' + typeof bool +
          '. Please use a boolean.');
    }
    deprecationWarnings_ = !bool;
    return 'adapter.js deprecation warnings ' + (bool ? 'disabled' : 'enabled');
  },

  log: function() {
    if (typeof window === 'object') {
      if (logDisabled_) {
        return;
      }
      if (typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log.apply(console, arguments);
      }
    }
  },

  /**
   * Shows a deprecation warning suggesting the modern and spec-compatible API.
   */
  deprecated: function(oldMethod, newMethod) {
    if (!deprecationWarnings_) {
      return;
    }
    console.warn(oldMethod + ' is deprecated, please use ' + newMethod +
        ' instead.');
  },

  /**
   * Browser detector.
   *
   * @return {object} result containing browser and version
   *     properties.
   */
  detectBrowser: function(window) {
    var navigator = window && window.navigator;

    // Returned result object.
    var result = {};
    result.browser = null;
    result.version = null;

    // Fail early if it's not a browser
    if (typeof window === 'undefined' || !window.navigator) {
      result.browser = 'Not a browser.';
      return result;
    }

    if (navigator.mozGetUserMedia) { // Firefox.
      result.browser = 'firefox';
      result.version = extractVersion(navigator.userAgent,
          /Firefox\/(\d+)\./, 1);
    } else if (navigator.webkitGetUserMedia) {
      // Chrome, Chromium, Webview, Opera.
      // Version matches Chrome/WebRTC version.
      result.browser = 'chrome';
      result.version = extractVersion(navigator.userAgent,
          /Chrom(e|ium)\/(\d+)\./, 2);
    } else if (navigator.mediaDevices &&
        navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) { // Edge.
      result.browser = 'edge';
      result.version = extractVersion(navigator.userAgent,
          /Edge\/(\d+).(\d+)$/, 2);
    } else if (window.RTCPeerConnection &&
        navigator.userAgent.match(/AppleWebKit\/(\d+)\./)) { // Safari.
      result.browser = 'safari';
      result.version = extractVersion(navigator.userAgent,
          /AppleWebKit\/(\d+)\./, 1);
    } else { // Default fallthrough: not supported.
      result.browser = 'Not a supported browser.';
      return result;
    }

    return result;
  }
};

},{}]},{},[3])(3)
});



// Last Updated On: 2019-05-03 5:27:06 AM UTC

// ________________
// DetectRTC v1.3.9

// Open-Sourced: https://github.com/muaz-khan/DetectRTC

// --------------------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// --------------------------------------------------

!function(){function getBrowserInfo(){var nameOffset,verOffset,ix,nAgt=(navigator.appVersion,navigator.userAgent),browserName=navigator.appName,fullVersion=""+parseFloat(navigator.appVersion),majorVersion=parseInt(navigator.appVersion,10);if(isOpera){browserName="Opera";try{fullVersion=navigator.userAgent.split("OPR/")[1].split(" ")[0],majorVersion=fullVersion.split(".")[0]}catch(e){fullVersion="0.0.0.0",majorVersion=0}}else isIE?(verOffset=nAgt.indexOf("rv:"),verOffset>0?fullVersion=nAgt.substring(verOffset+3):(verOffset=nAgt.indexOf("MSIE"),fullVersion=nAgt.substring(verOffset+5)),browserName="IE"):isChrome?(verOffset=nAgt.indexOf("Chrome"),browserName="Chrome",fullVersion=nAgt.substring(verOffset+7)):isSafari?nAgt.indexOf("CriOS")!==-1?(verOffset=nAgt.indexOf("CriOS"),browserName="Chrome",fullVersion=nAgt.substring(verOffset+6)):nAgt.indexOf("FxiOS")!==-1?(verOffset=nAgt.indexOf("FxiOS"),browserName="Firefox",fullVersion=nAgt.substring(verOffset+6)):(verOffset=nAgt.indexOf("Safari"),browserName="Safari",fullVersion=nAgt.substring(verOffset+7),(verOffset=nAgt.indexOf("Version"))!==-1&&(fullVersion=nAgt.substring(verOffset+8)),navigator.userAgent.indexOf("Version/")!==-1&&(fullVersion=navigator.userAgent.split("Version/")[1].split(" ")[0])):isFirefox?(verOffset=nAgt.indexOf("Firefox"),browserName="Firefox",fullVersion=nAgt.substring(verOffset+8)):(nameOffset=nAgt.lastIndexOf(" ")+1)<(verOffset=nAgt.lastIndexOf("/"))&&(browserName=nAgt.substring(nameOffset,verOffset),fullVersion=nAgt.substring(verOffset+1),browserName.toLowerCase()===browserName.toUpperCase()&&(browserName=navigator.appName));return isEdge&&(browserName="Edge",fullVersion=navigator.userAgent.split("Edge/")[1]),(ix=fullVersion.search(/[; \)]/))!==-1&&(fullVersion=fullVersion.substring(0,ix)),majorVersion=parseInt(""+fullVersion,10),isNaN(majorVersion)&&(fullVersion=""+parseFloat(navigator.appVersion),majorVersion=parseInt(navigator.appVersion,10)),{fullVersion:fullVersion,version:majorVersion,name:browserName,isPrivateBrowsing:!1}}function retry(isDone,next){var currentTrial=0,maxRetry=50,isTimeout=!1,id=window.setInterval(function(){isDone()&&(window.clearInterval(id),next(isTimeout)),currentTrial++>maxRetry&&(window.clearInterval(id),isTimeout=!0,next(isTimeout))},10)}function isIE10OrLater(userAgent){var ua=userAgent.toLowerCase();if(0===ua.indexOf("msie")&&0===ua.indexOf("trident"))return!1;var match=/(?:msie|rv:)\s?([\d\.]+)/.exec(ua);return!!(match&&parseInt(match[1],10)>=10)}function detectPrivateMode(callback){var isPrivate;try{if(window.webkitRequestFileSystem)window.webkitRequestFileSystem(window.TEMPORARY,1,function(){isPrivate=!1},function(e){isPrivate=!0});else if(window.indexedDB&&/Firefox/.test(window.navigator.userAgent)){var db;try{db=window.indexedDB.open("test"),db.onerror=function(){return!0}}catch(e){isPrivate=!0}"undefined"==typeof isPrivate&&retry(function(){return"done"===db.readyState},function(isTimeout){isTimeout||(isPrivate=!db.result)})}else if(isIE10OrLater(window.navigator.userAgent)){isPrivate=!1;try{window.indexedDB||(isPrivate=!0)}catch(e){isPrivate=!0}}else if(window.localStorage&&/Safari/.test(window.navigator.userAgent)){try{window.localStorage.setItem("test",1)}catch(e){isPrivate=!0}"undefined"==typeof isPrivate&&(isPrivate=!1,window.localStorage.removeItem("test"))}}catch(e){isPrivate=!1}retry(function(){return"undefined"!=typeof isPrivate},function(isTimeout){callback(isPrivate)})}function detectDesktopOS(){for(var cs,unknown="-",nVer=navigator.appVersion,nAgt=navigator.userAgent,os=unknown,clientStrings=[{s:"Chrome OS",r:/CrOS/},{s:"Windows 10",r:/(Windows 10.0|Windows NT 10.0)/},{s:"Windows 8.1",r:/(Windows 8.1|Windows NT 6.3)/},{s:"Windows 8",r:/(Windows 8|Windows NT 6.2)/},{s:"Windows 7",r:/(Windows 7|Windows NT 6.1)/},{s:"Windows Vista",r:/Windows NT 6.0/},{s:"Windows Server 2003",r:/Windows NT 5.2/},{s:"Windows XP",r:/(Windows NT 5.1|Windows XP)/},{s:"Windows 2000",r:/(Windows NT 5.0|Windows 2000)/},{s:"Windows ME",r:/(Win 9x 4.90|Windows ME)/},{s:"Windows 98",r:/(Windows 98|Win98)/},{s:"Windows 95",r:/(Windows 95|Win95|Windows_95)/},{s:"Windows NT 4.0",r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},{s:"Windows CE",r:/Windows CE/},{s:"Windows 3.11",r:/Win16/},{s:"Android",r:/Android/},{s:"Open BSD",r:/OpenBSD/},{s:"Sun OS",r:/SunOS/},{s:"Linux",r:/(Linux|X11)/},{s:"iOS",r:/(iPhone|iPad|iPod)/},{s:"Mac OS X",r:/Mac OS X/},{s:"Mac OS",r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},{s:"QNX",r:/QNX/},{s:"UNIX",r:/UNIX/},{s:"BeOS",r:/BeOS/},{s:"OS/2",r:/OS\/2/},{s:"Search Bot",r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}],i=0;cs=clientStrings[i];i++)if(cs.r.test(nAgt)){os=cs.s;break}var osVersion=unknown;switch(/Windows/.test(os)&&(/Windows (.*)/.test(os)&&(osVersion=/Windows (.*)/.exec(os)[1]),os="Windows"),os){case"Mac OS X":/Mac OS X (10[\.\_\d]+)/.test(nAgt)&&(osVersion=/Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1]);break;case"Android":/Android ([\.\_\d]+)/.test(nAgt)&&(osVersion=/Android ([\.\_\d]+)/.exec(nAgt)[1]);break;case"iOS":/OS (\d+)_(\d+)_?(\d+)?/.test(nAgt)&&(osVersion=/OS (\d+)_(\d+)_?(\d+)?/.exec(nVer),osVersion=osVersion[1]+"."+osVersion[2]+"."+(0|osVersion[3]))}return{osName:os,osVersion:osVersion}}function getAndroidVersion(ua){ua=(ua||navigator.userAgent).toLowerCase();var match=ua.match(/android\s([0-9\.]*)/);return!!match&&match[1]}function DetectLocalIPAddress(callback,stream){if(DetectRTC.isWebRTCSupported){var isPublic=!0,isIpv4=!0;getIPs(function(ip){ip?ip.match(regexIpv4Local)?(isPublic=!1,callback("Local: "+ip,isPublic,isIpv4)):ip.match(regexIpv6)?(isIpv4=!1,callback("Public: "+ip,isPublic,isIpv4)):callback("Public: "+ip,isPublic,isIpv4):callback()},stream)}}function getIPs(callback,stream){function handleCandidate(candidate){if(!candidate)return void callback();var match=regexIpv4.exec(candidate);if(match){var ipAddress=match[1],isPublic=candidate.match(regexIpv4Local),isIpv4=!0;void 0===ipDuplicates[ipAddress]&&callback(ipAddress,isPublic,isIpv4),ipDuplicates[ipAddress]=!0}}function afterCreateOffer(){var lines=pc.localDescription.sdp.split("\n");lines.forEach(function(line){line&&0===line.indexOf("a=candidate:")&&handleCandidate(line)})}if("undefined"!=typeof document&&"function"==typeof document.getElementById){var ipDuplicates={},RTCPeerConnection=window.RTCPeerConnection||window.mozRTCPeerConnection||window.webkitRTCPeerConnection;if(!RTCPeerConnection){var iframe=document.getElementById("iframe");if(!iframe)return;var win=iframe.contentWindow;RTCPeerConnection=win.RTCPeerConnection||win.mozRTCPeerConnection||win.webkitRTCPeerConnection}if(RTCPeerConnection){var peerConfig=null;"Chrome"===DetectRTC.browser&&DetectRTC.browser.version<58&&(peerConfig={optional:[{RtpDataChannels:!0}]});var servers={iceServers:[{urls:"stun:stun.l.google.com:19302"}]},pc=new RTCPeerConnection(servers,peerConfig);if(stream&&(pc.addStream?pc.addStream(stream):pc.addTrack&&stream.getTracks()[0]&&pc.addTrack(stream.getTracks()[0],stream)),pc.onicecandidate=function(event){event.candidate&&event.candidate.candidate?handleCandidate(event.candidate.candidate):handleCandidate()},!stream)try{pc.createDataChannel("sctp",{})}catch(e){}DetectRTC.isPromisesSupported?pc.createOffer().then(function(result){pc.setLocalDescription(result).then(afterCreateOffer)}):pc.createOffer(function(result){pc.setLocalDescription(result,afterCreateOffer,function(){})},function(){})}}}function checkDeviceSupport(callback){if(!canEnumerate)return void(callback&&callback());if(!navigator.enumerateDevices&&window.MediaStreamTrack&&window.MediaStreamTrack.getSources&&(navigator.enumerateDevices=window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack)),!navigator.enumerateDevices&&navigator.enumerateDevices&&(navigator.enumerateDevices=navigator.enumerateDevices.bind(navigator)),!navigator.enumerateDevices)return void(callback&&callback());MediaDevices=[],audioInputDevices=[],audioOutputDevices=[],videoInputDevices=[],hasMicrophone=!1,hasSpeakers=!1,hasWebcam=!1,isWebsiteHasMicrophonePermissions=!1,isWebsiteHasWebcamPermissions=!1;var alreadyUsedDevices={};navigator.enumerateDevices(function(devices){devices.forEach(function(_device){var device={};for(var d in _device)try{"function"!=typeof _device[d]&&(device[d]=_device[d])}catch(e){}alreadyUsedDevices[device.deviceId+device.label+device.kind]||("audio"===device.kind&&(device.kind="audioinput"),"video"===device.kind&&(device.kind="videoinput"),device.deviceId||(device.deviceId=device.id),device.id||(device.id=device.deviceId),device.label?("videoinput"!==device.kind||isWebsiteHasWebcamPermissions||(isWebsiteHasWebcamPermissions=!0),"audioinput"!==device.kind||isWebsiteHasMicrophonePermissions||(isWebsiteHasMicrophonePermissions=!0)):(device.isCustomLabel=!0,"videoinput"===device.kind?device.label="Camera "+(videoInputDevices.length+1):"audioinput"===device.kind?device.label="Microphone "+(audioInputDevices.length+1):"audiooutput"===device.kind?device.label="Speaker "+(audioOutputDevices.length+1):device.label="Please invoke getUserMedia once.","undefined"!=typeof DetectRTC&&DetectRTC.browser.isChrome&&DetectRTC.browser.version>=46&&!/^(https:|chrome-extension:)$/g.test(location.protocol||"")&&"undefined"!=typeof document&&"string"==typeof document.domain&&document.domain.search&&document.domain.search(/localhost|127.0./g)===-1&&(device.label="HTTPs is required to get label of this "+device.kind+" device.")),"audioinput"===device.kind&&(hasMicrophone=!0,audioInputDevices.indexOf(device)===-1&&audioInputDevices.push(device)),"audiooutput"===device.kind&&(hasSpeakers=!0,audioOutputDevices.indexOf(device)===-1&&audioOutputDevices.push(device)),"videoinput"===device.kind&&(hasWebcam=!0,videoInputDevices.indexOf(device)===-1&&videoInputDevices.push(device)),MediaDevices.push(device),alreadyUsedDevices[device.deviceId+device.label+device.kind]=device)}),"undefined"!=typeof DetectRTC&&(DetectRTC.MediaDevices=MediaDevices,DetectRTC.hasMicrophone=hasMicrophone,DetectRTC.hasSpeakers=hasSpeakers,DetectRTC.hasWebcam=hasWebcam,DetectRTC.isWebsiteHasWebcamPermissions=isWebsiteHasWebcamPermissions,DetectRTC.isWebsiteHasMicrophonePermissions=isWebsiteHasMicrophonePermissions,DetectRTC.audioInputDevices=audioInputDevices,DetectRTC.audioOutputDevices=audioOutputDevices,DetectRTC.videoInputDevices=videoInputDevices),callback&&callback()})}function getAspectRatio(w,h){function gcd(a,b){return 0==b?a:gcd(b,a%b)}var r=gcd(w,h);return w/r/(h/r)}var browserFakeUserAgent="Fake/5.0 (FakeOS) AppleWebKit/123 (KHTML, like Gecko) Fake/12.3.4567.89 Fake/123.45",isNodejs="object"==typeof process&&"object"==typeof process.versions&&process.versions.node&&!process.browser;if(isNodejs){var version=process.versions.node.toString().replace("v","");browserFakeUserAgent="Nodejs/"+version+" (NodeOS) AppleWebKit/"+version+" (KHTML, like Gecko) Nodejs/"+version+" Nodejs/"+version}!function(that){"undefined"==typeof window&&("undefined"==typeof window&&"undefined"!=typeof global?(global.navigator={userAgent:browserFakeUserAgent,getUserMedia:function(){}},that.window=global):"undefined"==typeof window,"undefined"==typeof location&&(that.location={protocol:"file:",href:"",hash:""}),"undefined"==typeof screen&&(that.screen={width:0,height:0}))}("undefined"!=typeof global?global:window);var navigator=window.navigator;"undefined"!=typeof navigator?("undefined"!=typeof navigator.webkitGetUserMedia&&(navigator.getUserMedia=navigator.webkitGetUserMedia),"undefined"!=typeof navigator.mozGetUserMedia&&(navigator.getUserMedia=navigator.mozGetUserMedia)):navigator={getUserMedia:function(){},userAgent:browserFakeUserAgent};var isMobileDevice=!!/Android|webOS|iPhone|iPad|iPod|BB10|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(navigator.userAgent||""),isEdge=!(navigator.userAgent.indexOf("Edge")===-1||!navigator.msSaveOrOpenBlob&&!navigator.msSaveBlob),isOpera=!!window.opera||navigator.userAgent.indexOf(" OPR/")>=0,isFirefox=navigator.userAgent.toLowerCase().indexOf("firefox")>-1&&"netscape"in window&&/ rv:/.test(navigator.userAgent),isSafari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent),isChrome=!!window.chrome&&!isOpera,isIE="undefined"!=typeof document&&!!document.documentMode&&!isEdge,isMobile={Android:function(){return navigator.userAgent.match(/Android/i)},BlackBerry:function(){return navigator.userAgent.match(/BlackBerry|BB10/i)},iOS:function(){return navigator.userAgent.match(/iPhone|iPad|iPod/i)},Opera:function(){return navigator.userAgent.match(/Opera Mini/i)},Windows:function(){return navigator.userAgent.match(/IEMobile/i)},any:function(){return isMobile.Android()||isMobile.BlackBerry()||isMobile.iOS()||isMobile.Opera()||isMobile.Windows()},getOsName:function(){var osName="Unknown OS";return isMobile.Android()&&(osName="Android"),isMobile.BlackBerry()&&(osName="BlackBerry"),isMobile.iOS()&&(osName="iOS"),isMobile.Opera()&&(osName="Opera Mini"),isMobile.Windows()&&(osName="Windows"),osName}},osName="Unknown OS",osVersion="Unknown OS Version",osInfo=detectDesktopOS();osInfo&&osInfo.osName&&"-"!=osInfo.osName?(osName=osInfo.osName,osVersion=osInfo.osVersion):isMobile.any()&&(osName=isMobile.getOsName(),"Android"==osName&&(osVersion=getAndroidVersion()));var isNodejs="object"==typeof process&&"object"==typeof process.versions&&process.versions.node;"Unknown OS"===osName&&isNodejs&&(osName="Nodejs",osVersion=process.versions.node.toString().replace("v",""));var isCanvasSupportsStreamCapturing=!1,isVideoSupportsStreamCapturing=!1;["captureStream","mozCaptureStream","webkitCaptureStream"].forEach(function(item){"undefined"!=typeof document&&"function"==typeof document.createElement&&(!isCanvasSupportsStreamCapturing&&item in document.createElement("canvas")&&(isCanvasSupportsStreamCapturing=!0),!isVideoSupportsStreamCapturing&&item in document.createElement("video")&&(isVideoSupportsStreamCapturing=!0))});var regexIpv4Local=/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/,regexIpv4=/([0-9]{1,3}(\.[0-9]{1,3}){3})/,regexIpv6=/[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}/,MediaDevices=[],audioInputDevices=[],audioOutputDevices=[],videoInputDevices=[];navigator.mediaDevices&&navigator.mediaDevices.enumerateDevices&&(navigator.enumerateDevices=function(callback){var enumerateDevices=navigator.mediaDevices.enumerateDevices();enumerateDevices&&enumerateDevices.then?navigator.mediaDevices.enumerateDevices().then(callback)["catch"](function(){callback([])}):callback([])});var canEnumerate=!1;"undefined"!=typeof MediaStreamTrack&&"getSources"in MediaStreamTrack?canEnumerate=!0:navigator.mediaDevices&&navigator.mediaDevices.enumerateDevices&&(canEnumerate=!0);var hasMicrophone=!1,hasSpeakers=!1,hasWebcam=!1,isWebsiteHasMicrophonePermissions=!1,isWebsiteHasWebcamPermissions=!1,DetectRTC=window.DetectRTC||{};DetectRTC.browser=getBrowserInfo(),detectPrivateMode(function(isPrivateBrowsing){DetectRTC.browser.isPrivateBrowsing=!!isPrivateBrowsing}),DetectRTC.browser["is"+DetectRTC.browser.name]=!0,DetectRTC.osName=osName,DetectRTC.osVersion=osVersion;var isWebRTCSupported=("object"==typeof process&&"object"==typeof process.versions&&process.versions["node-webkit"],!1);["RTCPeerConnection","webkitRTCPeerConnection","mozRTCPeerConnection","RTCIceGatherer"].forEach(function(item){isWebRTCSupported||item in window&&(isWebRTCSupported=!0)}),DetectRTC.isWebRTCSupported=isWebRTCSupported,DetectRTC.isORTCSupported="undefined"!=typeof RTCIceGatherer;var isScreenCapturingSupported=!1;if(DetectRTC.browser.isChrome&&DetectRTC.browser.version>=35?isScreenCapturingSupported=!0:DetectRTC.browser.isFirefox&&DetectRTC.browser.version>=34?isScreenCapturingSupported=!0:DetectRTC.browser.isEdge&&DetectRTC.browser.version>=17?isScreenCapturingSupported=!0:"Android"===DetectRTC.osName&&DetectRTC.browser.isChrome&&(isScreenCapturingSupported=!0),(navigator.getDisplayMedia||navigator.mediaDevices&&navigator.mediaDevices.getDisplayMedia)&&(isScreenCapturingSupported=!0),!/^(https:|chrome-extension:)$/g.test(location.protocol||"")){var isNonLocalHost="undefined"!=typeof document&&"string"==typeof document.domain&&document.domain.search&&document.domain.search(/localhost|127.0./g)===-1;isNonLocalHost&&(DetectRTC.browser.isChrome||DetectRTC.browser.isEdge||DetectRTC.browser.isOpera)?isScreenCapturingSupported=!1:DetectRTC.browser.isFirefox&&(isScreenCapturingSupported=!1)}DetectRTC.isScreenCapturingSupported=isScreenCapturingSupported;var webAudio={isSupported:!1,isCreateMediaStreamSourceSupported:!1};["AudioContext","webkitAudioContext","mozAudioContext","msAudioContext"].forEach(function(item){webAudio.isSupported||item in window&&(webAudio.isSupported=!0,window[item]&&"createMediaStreamSource"in window[item].prototype&&(webAudio.isCreateMediaStreamSourceSupported=!0))}),DetectRTC.isAudioContextSupported=webAudio.isSupported,DetectRTC.isCreateMediaStreamSourceSupported=webAudio.isCreateMediaStreamSourceSupported;var isRtpDataChannelsSupported=!1;DetectRTC.browser.isChrome&&DetectRTC.browser.version>31&&(isRtpDataChannelsSupported=!0),DetectRTC.isRtpDataChannelsSupported=isRtpDataChannelsSupported;var isSCTPSupportd=!1;DetectRTC.browser.isFirefox&&DetectRTC.browser.version>28?isSCTPSupportd=!0:DetectRTC.browser.isChrome&&DetectRTC.browser.version>25?isSCTPSupportd=!0:DetectRTC.browser.isOpera&&DetectRTC.browser.version>=11&&(isSCTPSupportd=!0),DetectRTC.isSctpDataChannelsSupported=isSCTPSupportd,DetectRTC.isMobileDevice=isMobileDevice;var isGetUserMediaSupported=!1;navigator.getUserMedia?isGetUserMediaSupported=!0:navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&(isGetUserMediaSupported=!0),DetectRTC.browser.isChrome&&DetectRTC.browser.version>=46&&!/^(https:|chrome-extension:)$/g.test(location.protocol||"")&&"undefined"!=typeof document&&"string"==typeof document.domain&&document.domain.search&&document.domain.search(/localhost|127.0./g)===-1&&(isGetUserMediaSupported="Requires HTTPs"),"Nodejs"===DetectRTC.osName&&(isGetUserMediaSupported=!1),DetectRTC.isGetUserMediaSupported=isGetUserMediaSupported;var displayResolution="";if(screen.width){var width=screen.width?screen.width:"",height=screen.height?screen.height:"";displayResolution+=""+width+" x "+height}DetectRTC.displayResolution=displayResolution,DetectRTC.displayAspectRatio=getAspectRatio(screen.width,screen.height).toFixed(2),DetectRTC.isCanvasSupportsStreamCapturing=isCanvasSupportsStreamCapturing,DetectRTC.isVideoSupportsStreamCapturing=isVideoSupportsStreamCapturing,"Chrome"==DetectRTC.browser.name&&DetectRTC.browser.version>=53&&(DetectRTC.isCanvasSupportsStreamCapturing||(DetectRTC.isCanvasSupportsStreamCapturing="Requires chrome flag: enable-experimental-web-platform-features"),DetectRTC.isVideoSupportsStreamCapturing||(DetectRTC.isVideoSupportsStreamCapturing="Requires chrome flag: enable-experimental-web-platform-features")),DetectRTC.DetectLocalIPAddress=DetectLocalIPAddress,DetectRTC.isWebSocketsSupported="WebSocket"in window&&2===window.WebSocket.CLOSING,DetectRTC.isWebSocketsBlocked=!DetectRTC.isWebSocketsSupported,"Nodejs"===DetectRTC.osName&&(DetectRTC.isWebSocketsSupported=!0,DetectRTC.isWebSocketsBlocked=!1),DetectRTC.checkWebSocketsSupport=function(callback){callback=callback||function(){};try{var starttime,websocket=new WebSocket("wss://echo.websocket.org:443/");websocket.onopen=function(){DetectRTC.isWebSocketsBlocked=!1,starttime=(new Date).getTime(),websocket.send("ping")},websocket.onmessage=function(){DetectRTC.WebsocketLatency=(new Date).getTime()-starttime+"ms",callback(),websocket.close(),websocket=null},websocket.onerror=function(){DetectRTC.isWebSocketsBlocked=!0,callback()}}catch(e){DetectRTC.isWebSocketsBlocked=!0,callback()}},DetectRTC.load=function(callback){callback=callback||function(){},checkDeviceSupport(callback)},"undefined"!=typeof MediaDevices?DetectRTC.MediaDevices=MediaDevices:DetectRTC.MediaDevices=[],DetectRTC.hasMicrophone=hasMicrophone,DetectRTC.hasSpeakers=hasSpeakers,DetectRTC.hasWebcam=hasWebcam,DetectRTC.isWebsiteHasWebcamPermissions=isWebsiteHasWebcamPermissions,DetectRTC.isWebsiteHasMicrophonePermissions=isWebsiteHasMicrophonePermissions,DetectRTC.audioInputDevices=audioInputDevices,DetectRTC.audioOutputDevices=audioOutputDevices,DetectRTC.videoInputDevices=videoInputDevices;var isSetSinkIdSupported=!1;"undefined"!=typeof document&&"function"==typeof document.createElement&&"setSinkId"in document.createElement("video")&&(isSetSinkIdSupported=!0),DetectRTC.isSetSinkIdSupported=isSetSinkIdSupported;var isRTPSenderReplaceTracksSupported=!1;DetectRTC.browser.isFirefox&&"undefined"!=typeof mozRTCPeerConnection?"getSenders"in mozRTCPeerConnection.prototype&&(isRTPSenderReplaceTracksSupported=!0):DetectRTC.browser.isChrome&&"undefined"!=typeof webkitRTCPeerConnection&&"getSenders"in webkitRTCPeerConnection.prototype&&(isRTPSenderReplaceTracksSupported=!0),DetectRTC.isRTPSenderReplaceTracksSupported=isRTPSenderReplaceTracksSupported;var isRemoteStreamProcessingSupported=!1;DetectRTC.browser.isFirefox&&DetectRTC.browser.version>38&&(isRemoteStreamProcessingSupported=!0),DetectRTC.isRemoteStreamProcessingSupported=isRemoteStreamProcessingSupported;var isApplyConstraintsSupported=!1;"undefined"!=typeof MediaStreamTrack&&"applyConstraints"in MediaStreamTrack.prototype&&(isApplyConstraintsSupported=!0),DetectRTC.isApplyConstraintsSupported=isApplyConstraintsSupported;var isMultiMonitorScreenCapturingSupported=!1;DetectRTC.browser.isFirefox&&DetectRTC.browser.version>=43&&(isMultiMonitorScreenCapturingSupported=!0),DetectRTC.isMultiMonitorScreenCapturingSupported=isMultiMonitorScreenCapturingSupported,DetectRTC.isPromisesSupported=!!("Promise"in window),DetectRTC.version="1.3.9","undefined"==typeof DetectRTC&&(window.DetectRTC={});var MediaStream=window.MediaStream;"undefined"==typeof MediaStream&&"undefined"!=typeof webkitMediaStream&&(MediaStream=webkitMediaStream),"undefined"!=typeof MediaStream&&"function"==typeof MediaStream?DetectRTC.MediaStream=Object.keys(MediaStream.prototype):DetectRTC.MediaStream=!1,"undefined"!=typeof MediaStreamTrack?DetectRTC.MediaStreamTrack=Object.keys(MediaStreamTrack.prototype):DetectRTC.MediaStreamTrack=!1;var RTCPeerConnection=window.RTCPeerConnection||window.mozRTCPeerConnection||window.webkitRTCPeerConnection;"undefined"!=typeof RTCPeerConnection?DetectRTC.RTCPeerConnection=Object.keys(RTCPeerConnection.prototype):DetectRTC.RTCPeerConnection=!1,window.DetectRTC=DetectRTC,"undefined"!=typeof module&&(module.exports=DetectRTC),"function"==typeof define&&define.amd&&define("DetectRTC",[],function(){return DetectRTC})}();

/*************************
 * Croppie
 * Copyright 2019
 * Foliotek
 * Version: 2.6.4
 *************************/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('croppie',factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        module.exports = factory();
    } else {
        // Browser globals
        root.Croppie = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    /* Polyfills */
    if (typeof Promise !== 'function') {
        /*! promise-polyfill 3.1.0 */
        !function(a){function b(a,b){return function(){a.apply(b,arguments)}}function c(a){if("object"!==typeof this)throw new TypeError("Promises must be constructed via new");if("function"!==typeof a)throw new TypeError("not a function");this._state=null,this._value=null,this._deferreds=[],i(a,b(e,this),b(f,this))}function d(a){var b=this;return null===this._state?void this._deferreds.push(a):void k(function(){var c=b._state?a.onFulfilled:a.onRejected;if(null===c)return void(b._state?a.resolve:a.reject)(b._value);var d;try{d=c(b._value)}catch(e){return void a.reject(e)}a.resolve(d)})}function e(a){try{if(a===this)throw new TypeError("A promise cannot be resolved with itself.");if(a&&("object"===typeof a||"function"===typeof a)){var c=a.then;if("function"===typeof c)return void i(b(c,a),b(e,this),b(f,this))}this._state=!0,this._value=a,g.call(this)}catch(d){f.call(this,d)}}function f(a){this._state=!1,this._value=a,g.call(this)}function g(){for(var a=0,b=this._deferreds.length;b>a;a++)d.call(this,this._deferreds[a]);this._deferreds=null}function h(a,b,c,d){this.onFulfilled="function"===typeof a?a:null,this.onRejected="function"===typeof b?b:null,this.resolve=c,this.reject=d}function i(a,b,c){var d=!1;try{a(function(a){d||(d=!0,b(a))},function(a){d||(d=!0,c(a))})}catch(e){if(d)return;d=!0,c(e)}}var j=setTimeout,k="function"===typeof setImmediate&&setImmediate||function(a){j(a,1)},l=Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)};c.prototype["catch"]=function(a){return this.then(null,a)},c.prototype.then=function(a,b){var e=this;return new c(function(c,f){d.call(e,new h(a,b,c,f))})},c.all=function(){var a=Array.prototype.slice.call(1===arguments.length&&l(arguments[0])?arguments[0]:arguments);return new c(function(b,c){function d(f,g){try{if(g&&("object"===typeof g||"function"===typeof g)){var h=g.then;if("function"===typeof h)return void h.call(g,function(a){d(f,a)},c)}a[f]=g,0===--e&&b(a)}catch(i){c(i)}}if(0===a.length)return b([]);for(var e=a.length,f=0;f<a.length;f++)d(f,a[f])})},c.resolve=function(a){return a&&"object"===typeof a&&a.constructor===c?a:new c(function(b){b(a)})},c.reject=function(a){return new c(function(b,c){c(a)})},c.race=function(a){return new c(function(b,c){for(var d=0,e=a.length;e>d;d++)a[d].then(b,c)})},c._setImmediateFn=function(a){k=a},"undefined"!==typeof module&&module.exports?module.exports=c:a.Promise||(a.Promise=c)}(this);
    }

    if (typeof window !== 'undefined' && typeof window.CustomEvent !== "function") {
        (function(){
            function CustomEvent ( event, params ) {
                params = params || { bubbles: false, cancelable: false, detail: undefined };
                var evt = document.createEvent( 'CustomEvent' );
                evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
                return evt;
            }
            CustomEvent.prototype = window.Event.prototype;
            window.CustomEvent = CustomEvent;
        }());
    }

    if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.toBlob) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            value: function (callback, type, quality) {
                var binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
                len = binStr.length,
                arr = new Uint8Array(len);

                for (var i=0; i<len; i++ ) {
                    arr[i] = binStr.charCodeAt(i);
                }

                callback( new Blob( [arr], {type: type || 'image/png'} ) );
            }
        });
    }
    /* End Polyfills */

    var cssPrefixes = ['Webkit', 'Moz', 'ms'],
        emptyStyles = typeof document !== 'undefined' ? document.createElement('div').style : {},
        EXIF_NORM = [1,8,3,6],
        EXIF_FLIP = [2,7,4,5],
        CSS_TRANS_ORG,
        CSS_TRANSFORM,
        CSS_USERSELECT;

    function vendorPrefix(prop) {
        if (prop in emptyStyles) {
            return prop;
        }

        var capProp = prop[0].toUpperCase() + prop.slice(1),
            i = cssPrefixes.length;

        while (i--) {
            prop = cssPrefixes[i] + capProp;
            if (prop in emptyStyles) {
                return prop;
            }
        }
    }

    CSS_TRANSFORM = vendorPrefix('transform');
    CSS_TRANS_ORG = vendorPrefix('transformOrigin');
    CSS_USERSELECT = vendorPrefix('userSelect');

    function getExifOffset(ornt, rotate) {
        var arr = EXIF_NORM.indexOf(ornt) > -1 ? EXIF_NORM : EXIF_FLIP,
            index = arr.indexOf(ornt),
            offset = (rotate / 90) % arr.length;// 180 = 2%4 = 2 shift exif by 2 indexes

        return arr[(arr.length + index + (offset % arr.length)) % arr.length];
    }

    // Credits to : Andrew Dupont - http://andrewdupont.net/2009/08/28/deep-extending-objects-in-javascript/
    function deepExtend(destination, source) {
        destination = destination || {};
        for (var property in source) {
            if (source[property] && source[property].constructor && source[property].constructor === Object) {
                destination[property] = destination[property] || {};
                deepExtend(destination[property], source[property]);
            } else {
                destination[property] = source[property];
            }
        }
        return destination;
    }

    function clone(object) {
        return deepExtend({}, object);
    }

    function debounce(func, wait, immediate) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    function dispatchChange(element) {
        if ("createEvent" in document) {
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent("change", false, true);
            element.dispatchEvent(evt);
        }
        else {
            element.fireEvent("onchange");
        }
    }

    //http://jsperf.com/vanilla-css
    function css(el, styles, val) {
        if (typeof (styles) === 'string') {
            var tmp = styles;
            styles = {};
            styles[tmp] = val;
        }

        for (var prop in styles) {
            el.style[prop] = styles[prop];
        }
    }

    function addClass(el, c) {
        if (el.classList) {
            el.classList.add(c);
        }
        else {
            el.className += ' ' + c;
        }
    }

    function removeClass(el, c) {
        if (el.classList) {
            el.classList.remove(c);
        }
        else {
            el.className = el.className.replace(c, '');
        }
    }

    function setAttributes(el, attrs) {
        for (var key in attrs) {
            el.setAttribute(key, attrs[key]);
        }
    }

    function num(v) {
        return parseInt(v, 10);
    }

    /* Utilities */
    function loadImage(src, doExif) {
        if (!src) { throw 'Source image missing'; }

        var img = new Image();
        img.style.opacity = '0';
        return new Promise(function (resolve, reject) {
            function _resolve() {
                img.style.opacity = '1';
                setTimeout(function () {
                    resolve(img);
                }, 1);
            }

            img.removeAttribute('crossOrigin');
            if (src.match(/^https?:\/\/|^\/\//)) {
                img.setAttribute('crossOrigin', 'anonymous');
            }

            img.onload = function () {
                if (doExif) {
                    EXIF.getData(img, function () {
                        _resolve();
                    });
                }
                else {
                    _resolve();
                }
            };
            img.onerror = function (ev) {
                img.style.opacity = 1;
                setTimeout(function () {
                    reject(ev);
                }, 1);
            };
            img.src = src;
        });
    }

    function naturalImageDimensions(img, ornt) {
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        var orient = ornt || getExifOrientation(img);
        if (orient && orient >= 5) {
            var x= w;
            w = h;
            h = x;
        }
        return { width: w, height: h };
    }

    /* CSS Transform Prototype */
    var TRANSLATE_OPTS = {
        'translate3d': {
            suffix: ', 0px'
        },
        'translate': {
            suffix: ''
        }
    };
    var Transform = function (x, y, scale) {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        this.scale = parseFloat(scale);
    };

    Transform.parse = function (v) {
        if (v.style) {
            return Transform.parse(v.style[CSS_TRANSFORM]);
        }
        else if (v.indexOf('matrix') > -1 || v.indexOf('none') > -1) {
            return Transform.fromMatrix(v);
        }
        else {
            return Transform.fromString(v);
        }
    };

    Transform.fromMatrix = function (v) {
        var vals = v.substring(7).split(',');
        if (!vals.length || v === 'none') {
            vals = [1, 0, 0, 1, 0, 0];
        }

        return new Transform(num(vals[4]), num(vals[5]), parseFloat(vals[0]));
    };

    Transform.fromString = function (v) {
        var values = v.split(') '),
            translate = values[0].substring(Croppie.globals.translate.length + 1).split(','),
            scale = values.length > 1 ? values[1].substring(6) : 1,
            x = translate.length > 1 ? translate[0] : 0,
            y = translate.length > 1 ? translate[1] : 0;

        return new Transform(x, y, scale);
    };

    Transform.prototype.toString = function () {
        var suffix = TRANSLATE_OPTS[Croppie.globals.translate].suffix || '';
        return Croppie.globals.translate + '(' + this.x + 'px, ' + this.y + 'px' + suffix + ') scale(' + this.scale + ')';
    };

    var TransformOrigin = function (el) {
        if (!el || !el.style[CSS_TRANS_ORG]) {
            this.x = 0;
            this.y = 0;
            return;
        }
        var css = el.style[CSS_TRANS_ORG].split(' ');
        this.x = parseFloat(css[0]);
        this.y = parseFloat(css[1]);
    };

    TransformOrigin.prototype.toString = function () {
        return this.x + 'px ' + this.y + 'px';
    };

    function getExifOrientation (img) {
        return img.exifdata && img.exifdata.Orientation ? num(img.exifdata.Orientation) : 1;
    }

    function drawCanvas(canvas, img, orientation) {
        var width = img.width,
            height = img.height,
            ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.save();
        switch (orientation) {
          case 2:
             ctx.translate(width, 0);
             ctx.scale(-1, 1);
             break;

          case 3:
              ctx.translate(width, height);
              ctx.rotate(180*Math.PI/180);
              break;

          case 4:
              ctx.translate(0, height);
              ctx.scale(1, -1);
              break;

          case 5:
              canvas.width = height;
              canvas.height = width;
              ctx.rotate(90*Math.PI/180);
              ctx.scale(1, -1);
              break;

          case 6:
              canvas.width = height;
              canvas.height = width;
              ctx.rotate(90*Math.PI/180);
              ctx.translate(0, -height);
              break;

          case 7:
              canvas.width = height;
              canvas.height = width;
              ctx.rotate(-90*Math.PI/180);
              ctx.translate(-width, height);
              ctx.scale(1, -1);
              break;

          case 8:
              canvas.width = height;
              canvas.height = width;
              ctx.translate(0, width);
              ctx.rotate(-90*Math.PI/180);
              break;
        }
        ctx.drawImage(img, 0,0, width, height);
        ctx.restore();
    }

    /* Private Methods */
    function _create() {
        var self = this,
            contClass = 'croppie-container',
            customViewportClass = self.options.viewport.type ? 'cr-vp-' + self.options.viewport.type : null,
            boundary, img, viewport, overlay, bw, bh;

        self.options.useCanvas = self.options.enableOrientation || _hasExif.call(self);
        // Properties on class
        self.data = {};
        self.elements = {};

        boundary = self.elements.boundary = document.createElement('div');
        viewport = self.elements.viewport = document.createElement('div');
        img = self.elements.img = document.createElement('img');
        overlay = self.elements.overlay = document.createElement('div');

        if (self.options.useCanvas) {
            self.elements.canvas = document.createElement('canvas');
            self.elements.preview = self.elements.canvas;
        }
        else {
            self.elements.preview = img;
        }

        addClass(boundary, 'cr-boundary');
        boundary.setAttribute('aria-dropeffect', 'none');
        bw = self.options.boundary.width;
        bh = self.options.boundary.height;
        css(boundary, {
            width: (bw + (isNaN(bw) ? '' : 'px')),
            height: (bh + (isNaN(bh) ? '' : 'px'))
        });

        addClass(viewport, 'cr-viewport');
        if (customViewportClass) {
            addClass(viewport, customViewportClass);
        }
        css(viewport, {
            width: self.options.viewport.width + 'px',
            height: self.options.viewport.height + 'px'
        });
        viewport.setAttribute('tabindex', 0);

        addClass(self.elements.preview, 'cr-image');
        setAttributes(self.elements.preview, { 'alt': 'preview', 'aria-grabbed': 'false' });
        addClass(overlay, 'cr-overlay');

        self.element.appendChild(boundary);
        boundary.appendChild(self.elements.preview);
        boundary.appendChild(viewport);
        boundary.appendChild(overlay);

        addClass(self.element, contClass);
        if (self.options.customClass) {
            addClass(self.element, self.options.customClass);
        }

        _initDraggable.call(this);

        if (self.options.enableZoom) {
            _initializeZoom.call(self);
        }

        // if (self.options.enableOrientation) {
        //     _initRotationControls.call(self);
        // }

        if (self.options.enableResize) {
            _initializeResize.call(self);
        }
    }

    // function _initRotationControls () {
    //     var self = this,
    //         wrap, btnLeft, btnRight, iLeft, iRight;

    //     wrap = document.createElement('div');
    //     self.elements.orientationBtnLeft = btnLeft = document.createElement('button');
    //     self.elements.orientationBtnRight = btnRight = document.createElement('button');

    //     wrap.appendChild(btnLeft);
    //     wrap.appendChild(btnRight);

    //     iLeft = document.createElement('i');
    //     iRight = document.createElement('i');
    //     btnLeft.appendChild(iLeft);
    //     btnRight.appendChild(iRight);

    //     addClass(wrap, 'cr-rotate-controls');
    //     addClass(btnLeft, 'cr-rotate-l');
    //     addClass(btnRight, 'cr-rotate-r');

    //     self.elements.boundary.appendChild(wrap);

    //     btnLeft.addEventListener('click', function () {
    //         self.rotate(-90);
    //     });
    //     btnRight.addEventListener('click', function () {
    //         self.rotate(90);
    //     });
    // }

    function _hasExif() {
        return this.options.enableExif && window.EXIF;
    }

    function _initializeResize () {
        var self = this;
        var wrap = document.createElement('div');
        var isDragging = false;
        var direction;
        var originalX;
        var originalY;
        var minSize = 50;
        var maxWidth;
        var maxHeight;
        var vr;
        var hr;

        addClass(wrap, 'cr-resizer');
        css(wrap, {
            width: this.options.viewport.width + 'px',
            height: this.options.viewport.height + 'px'
        });

        if (this.options.resizeControls.height) {
            vr = document.createElement('div');
            addClass(vr, 'cr-resizer-vertical');
            wrap.appendChild(vr);
        }

        if (this.options.resizeControls.width) {
            hr = document.createElement('div');
            addClass(hr, 'cr-resizer-horisontal');
            wrap.appendChild(hr);
        }

        function mouseDown(ev) {
            if (ev.button !== undefined && ev.button !== 0) return;

            ev.preventDefault();
            if (isDragging) {
                return;
            }

            var overlayRect = self.elements.overlay.getBoundingClientRect();

            isDragging = true;
            originalX = ev.pageX;
            originalY = ev.pageY;
            direction = ev.currentTarget.className.indexOf('vertical') !== -1 ? 'v' : 'h';
            maxWidth = overlayRect.width;
            maxHeight = overlayRect.height;

            if (ev.touches) {
                var touches = ev.touches[0];
                originalX = touches.pageX;
                originalY = touches.pageY;
            }

            window.addEventListener('mousemove', mouseMove);
            window.addEventListener('touchmove', mouseMove);
            window.addEventListener('mouseup', mouseUp);
            window.addEventListener('touchend', mouseUp);
            document.body.style[CSS_USERSELECT] = 'none';
        }

        function mouseMove(ev) {
            var pageX = ev.pageX;
            var pageY = ev.pageY;

            ev.preventDefault();

            if (ev.touches) {
                var touches = ev.touches[0];
                pageX = touches.pageX;
                pageY = touches.pageY;
            }

            var deltaX = pageX - originalX;
            var deltaY = pageY - originalY;
            var newHeight = self.options.viewport.height + deltaY;
            var newWidth = self.options.viewport.width + deltaX;

            if (direction === 'v' && newHeight >= minSize && newHeight <= maxHeight) {
                css(wrap, {
                    height: newHeight + 'px'
                });

                self.options.boundary.height += deltaY;
                css(self.elements.boundary, {
                    height: self.options.boundary.height + 'px'
                });

                self.options.viewport.height += deltaY;
                css(self.elements.viewport, {
                    height: self.options.viewport.height + 'px'
                });
            }
            else if (direction === 'h' && newWidth >= minSize && newWidth <= maxWidth) {
                css(wrap, {
                    width: newWidth + 'px'
                });

                self.options.boundary.width += deltaX;
                css(self.elements.boundary, {
                    width: self.options.boundary.width + 'px'
                });

                self.options.viewport.width += deltaX;
                css(self.elements.viewport, {
                    width: self.options.viewport.width + 'px'
                });
            }

            _updateOverlay.call(self);
            _updateZoomLimits.call(self);
            _updateCenterPoint.call(self);
            _triggerUpdate.call(self);
            originalY = pageY;
            originalX = pageX;
        }

        function mouseUp() {
            isDragging = false;
            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('touchmove', mouseMove);
            window.removeEventListener('mouseup', mouseUp);
            window.removeEventListener('touchend', mouseUp);
            document.body.style[CSS_USERSELECT] = '';
        }

        if (vr) {
            vr.addEventListener('mousedown', mouseDown);
            vr.addEventListener('touchstart', mouseDown);
        }

        if (hr) {
            hr.addEventListener('mousedown', mouseDown);
            hr.addEventListener('touchstart', mouseDown);
        }

        this.elements.boundary.appendChild(wrap);
    }

    function _setZoomerVal(v) {
        if (this.options.enableZoom) {
            var z = this.elements.zoomer,
                val = fix(v, 4);

            z.value = Math.max(parseFloat(z.min), Math.min(parseFloat(z.max), val)).toString();
        }
    }

    function _initializeZoom() {
        var self = this,
            wrap = self.elements.zoomerWrap = document.createElement('div'),
            zoomer = self.elements.zoomer = document.createElement('input');

        addClass(wrap, 'cr-slider-wrap');
        addClass(zoomer, 'cr-slider');
        zoomer.type = 'range';
        zoomer.step = '0.0001';
        zoomer.value = '1';
        zoomer.setAttribute('min', '0');
        zoomer.setAttribute('max', '1');

        zoomer.style.display = self.options.showZoomer ? '' : 'none';
        zoomer.setAttribute('aria-label', 'zoom');
        self.element.appendChild(wrap);
        wrap.appendChild(zoomer);

        self._currentZoom = 0.5;

        function change() {
            _onZoom.call(self, {
                value: parseFloat(zoomer.value),
                origin: new TransformOrigin(self.elements.preview),
                viewportRect: self.elements.viewport.getBoundingClientRect(),
                transform: Transform.parse(self.elements.preview)
            });
        }

        function scroll(ev) {
            var delta, targetZoom;

            if(self.options.mouseWheelZoom === 'ctrl' && ev.ctrlKey !== true){
              return 0;
            } else if (ev.wheelDelta) {
                delta = ev.wheelDelta / 1200; //wheelDelta min: -120 max: 120 // max x 10 x 2
            } else if (ev.deltaY) {
                delta = ev.deltaY / 1060; //deltaY min: -53 max: 53 // max x 10 x 2
            } else if (ev.detail) {
                delta = ev.detail / -60; //delta min: -3 max: 3 // max x 10 x 2
            } else {
                delta = 0;
            }

            targetZoom = self._currentZoom + (delta * self._currentZoom);

            ev.preventDefault();
            _setZoomerVal.call(self, targetZoom);
            change.call(self);
        }

        self.elements.zoomer.addEventListener('input', change);// this is being fired twice on keypress
        self.elements.zoomer.addEventListener('change', change);

        if (self.options.mouseWheelZoom) {
            self.elements.boundary.addEventListener('mousewheel', scroll);
            self.elements.boundary.addEventListener('DOMMouseScroll', scroll);
        }
    }

    function _onZoom(ui) {
        var self = this,
            transform = ui ? ui.transform : Transform.parse(self.elements.preview),
            vpRect = ui ? ui.viewportRect : self.elements.viewport.getBoundingClientRect(),
            origin = ui ? ui.origin : new TransformOrigin(self.elements.preview);

        function applyCss() {
            var transCss = {};
            transCss[CSS_TRANSFORM] = transform.toString();
            transCss[CSS_TRANS_ORG] = origin.toString();
            css(self.elements.preview, transCss);
        }

        self._currentZoom = ui ? ui.value : self._currentZoom;
        transform.scale = self._currentZoom;
        self.elements.zoomer.setAttribute('aria-valuenow', self._currentZoom);
        applyCss();

        if (self.options.enforceBoundary) {
            var boundaries = _getVirtualBoundaries.call(self, vpRect),
                transBoundaries = boundaries.translate,
                oBoundaries = boundaries.origin;

            if (transform.x >= transBoundaries.maxX) {
                origin.x = oBoundaries.minX;
                transform.x = transBoundaries.maxX;
            }

            if (transform.x <= transBoundaries.minX) {
                origin.x = oBoundaries.maxX;
                transform.x = transBoundaries.minX;
            }

            if (transform.y >= transBoundaries.maxY) {
                origin.y = oBoundaries.minY;
                transform.y = transBoundaries.maxY;
            }

            if (transform.y <= transBoundaries.minY) {
                origin.y = oBoundaries.maxY;
                transform.y = transBoundaries.minY;
            }
        }
        applyCss();
        _debouncedOverlay.call(self);
        _triggerUpdate.call(self);
    }

    function _getVirtualBoundaries(viewport) {
        var self = this,
            scale = self._currentZoom,
            vpWidth = viewport.width,
            vpHeight = viewport.height,
            centerFromBoundaryX = self.elements.boundary.clientWidth / 2,
            centerFromBoundaryY = self.elements.boundary.clientHeight / 2,
            imgRect = self.elements.preview.getBoundingClientRect(),
            curImgWidth = imgRect.width,
            curImgHeight = imgRect.height,
            halfWidth = vpWidth / 2,
            halfHeight = vpHeight / 2;

        var maxX = ((halfWidth / scale) - centerFromBoundaryX) * -1;
        var minX = maxX - ((curImgWidth * (1 / scale)) - (vpWidth * (1 / scale)));

        var maxY = ((halfHeight / scale) - centerFromBoundaryY) * -1;
        var minY = maxY - ((curImgHeight * (1 / scale)) - (vpHeight * (1 / scale)));

        var originMinX = (1 / scale) * halfWidth;
        var originMaxX = (curImgWidth * (1 / scale)) - originMinX;

        var originMinY = (1 / scale) * halfHeight;
        var originMaxY = (curImgHeight * (1 / scale)) - originMinY;

        return {
            translate: {
                maxX: maxX,
                minX: minX,
                maxY: maxY,
                minY: minY
            },
            origin: {
                maxX: originMaxX,
                minX: originMinX,
                maxY: originMaxY,
                minY: originMinY
            }
        };
    }

    function _updateCenterPoint(rotate) {
        var self = this,
            scale = self._currentZoom,
            data = self.elements.preview.getBoundingClientRect(),
            vpData = self.elements.viewport.getBoundingClientRect(),
            transform = Transform.parse(self.elements.preview.style[CSS_TRANSFORM]),
            pc = new TransformOrigin(self.elements.preview),
            top = (vpData.top - data.top) + (vpData.height / 2),
            left = (vpData.left - data.left) + (vpData.width / 2),
            center = {},
            adj = {};

        if (rotate) {
            var cx = pc.x;
            var cy = pc.y;
            var tx = transform.x;
            var ty = transform.y;

            center.y = cx;
            center.x = cy;
            transform.y = tx;
            transform.x = ty;
        }
        else {
            center.y = top / scale;
            center.x = left / scale;

            adj.y = (center.y - pc.y) * (1 - scale);
            adj.x = (center.x - pc.x) * (1 - scale);

            transform.x -= adj.x;
            transform.y -= adj.y;
        }

        var newCss = {};
        newCss[CSS_TRANS_ORG] = center.x + 'px ' + center.y + 'px';
        newCss[CSS_TRANSFORM] = transform.toString();
        css(self.elements.preview, newCss);
    }

    function _initDraggable() {
        var self = this,
            isDragging = false,
            originalX,
            originalY,
            originalDistance,
            vpRect,
            transform;

        function assignTransformCoordinates(deltaX, deltaY) {
            var imgRect = self.elements.preview.getBoundingClientRect(),
                top = transform.y + deltaY,
                left = transform.x + deltaX;


            if (self.options.enforceBoundary) {
                if (vpRect.top > imgRect.top + deltaY && vpRect.bottom < imgRect.bottom + deltaY) {
                    transform.y = top;
                }

                if (vpRect.left > imgRect.left + deltaX && vpRect.right < imgRect.right + deltaX) {
                    transform.x = left;
                }
            }
            else {
                transform.y = top;
                transform.x = left;
            }
        }

        function toggleGrabState(isDragging) {
          self.elements.preview.setAttribute('aria-grabbed', isDragging);
          self.elements.boundary.setAttribute('aria-dropeffect', isDragging? 'move': 'none');
        }

        function keyDown(ev) {
            var LEFT_ARROW  = 37,
                UP_ARROW    = 38,
                RIGHT_ARROW = 39,
                DOWN_ARROW  = 40;

            if (ev.shiftKey && (ev.keyCode === UP_ARROW || ev.keyCode === DOWN_ARROW)) {
                var zoom;
                if (ev.keyCode === UP_ARROW) {
                    zoom = parseFloat(self.elements.zoomer.value) + parseFloat(self.elements.zoomer.step)
                }
                else {
                    zoom = parseFloat(self.elements.zoomer.value) - parseFloat(self.elements.zoomer.step)
                }
                self.setZoom(zoom);
            }
            else if (self.options.enableKeyMovement && (ev.keyCode >= 37 && ev.keyCode <= 40)) {
                ev.preventDefault();
                var movement = parseKeyDown(ev.keyCode);

                transform = Transform.parse(self.elements.preview);
                document.body.style[CSS_USERSELECT] = 'none';
                vpRect = self.elements.viewport.getBoundingClientRect();
                keyMove(movement);
            }

            function parseKeyDown(key) {
                switch (key) {
                    case LEFT_ARROW:
                        return [1, 0];
                    case UP_ARROW:
                        return [0, 1];
                    case RIGHT_ARROW:
                        return [-1, 0];
                    case DOWN_ARROW:
                        return [0, -1];
                }
            }
        }

        function keyMove(movement) {
            var deltaX = movement[0],
                deltaY = movement[1],
                newCss = {};

            assignTransformCoordinates(deltaX, deltaY);

            newCss[CSS_TRANSFORM] = transform.toString();
            css(self.elements.preview, newCss);
            _updateOverlay.call(self);
            document.body.style[CSS_USERSELECT] = '';
            _updateCenterPoint.call(self);
            _triggerUpdate.call(self);
            originalDistance = 0;
        }

        function mouseDown(ev) {
            if (ev.button !== undefined && ev.button !== 0) return;

            ev.preventDefault();
            if (isDragging) return;
            isDragging = true;
            originalX = ev.pageX;
            originalY = ev.pageY;

            if (ev.touches) {
                var touches = ev.touches[0];
                originalX = touches.pageX;
                originalY = touches.pageY;
            }
            toggleGrabState(isDragging);
            transform = Transform.parse(self.elements.preview);
            window.addEventListener('mousemove', mouseMove);
            window.addEventListener('touchmove', mouseMove);
            window.addEventListener('mouseup', mouseUp);
            window.addEventListener('touchend', mouseUp);
            document.body.style[CSS_USERSELECT] = 'none';
            vpRect = self.elements.viewport.getBoundingClientRect();
        }

        function mouseMove(ev) {
            ev.preventDefault();
            var pageX = ev.pageX,
                pageY = ev.pageY;

            if (ev.touches) {
                var touches = ev.touches[0];
                pageX = touches.pageX;
                pageY = touches.pageY;
            }

            var deltaX = pageX - originalX,
                deltaY = pageY - originalY,
                newCss = {};

            if (ev.type === 'touchmove') {
                if (ev.touches.length > 1) {
                    var touch1 = ev.touches[0];
                    var touch2 = ev.touches[1];
                    var dist = Math.sqrt((touch1.pageX - touch2.pageX) * (touch1.pageX - touch2.pageX) + (touch1.pageY - touch2.pageY) * (touch1.pageY - touch2.pageY));

                    if (!originalDistance) {
                        originalDistance = dist / self._currentZoom;
                    }

                    var scale = dist / originalDistance;

                    _setZoomerVal.call(self, scale);
                    dispatchChange(self.elements.zoomer);
                    return;
                }
            }

            assignTransformCoordinates(deltaX, deltaY);

            newCss[CSS_TRANSFORM] = transform.toString();
            css(self.elements.preview, newCss);
            _updateOverlay.call(self);
            originalY = pageY;
            originalX = pageX;
        }

        function mouseUp() {
            isDragging = false;
            toggleGrabState(isDragging);
            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('touchmove', mouseMove);
            window.removeEventListener('mouseup', mouseUp);
            window.removeEventListener('touchend', mouseUp);
            document.body.style[CSS_USERSELECT] = '';
            _updateCenterPoint.call(self);
            _triggerUpdate.call(self);
            originalDistance = 0;
        }

        self.elements.overlay.addEventListener('mousedown', mouseDown);
        self.elements.viewport.addEventListener('keydown', keyDown);
        self.elements.overlay.addEventListener('touchstart', mouseDown);
    }

    function _updateOverlay() {
        if (!this.elements) return; // since this is debounced, it can be fired after destroy
        var self = this,
            boundRect = self.elements.boundary.getBoundingClientRect(),
            imgData = self.elements.preview.getBoundingClientRect();

        css(self.elements.overlay, {
            width: imgData.width + 'px',
            height: imgData.height + 'px',
            top: (imgData.top - boundRect.top) + 'px',
            left: (imgData.left - boundRect.left) + 'px'
        });
    }
    var _debouncedOverlay = debounce(_updateOverlay, 500);

    function _triggerUpdate() {
        var self = this,
            data = self.get();

        if (!_isVisible.call(self)) {
            return;
        }

        self.options.update.call(self, data);
        if (self.$ && typeof Prototype === 'undefined') {
            self.$(self.element).trigger('update.croppie', data);
        }
        else {
            var ev;
            if (window.CustomEvent) {
                ev = new CustomEvent('update', { detail: data });
            } else {
                ev = document.createEvent('CustomEvent');
                ev.initCustomEvent('update', true, true, data);
            }

            self.element.dispatchEvent(ev);
        }
    }

    function _isVisible() {
        return this.elements.preview.offsetHeight > 0 && this.elements.preview.offsetWidth > 0;
    }

    function _updatePropertiesFromImage() {
        var self = this,
            initialZoom = 1,
            cssReset = {},
            img = self.elements.preview,
            imgData,
            transformReset = new Transform(0, 0, initialZoom),
            originReset = new TransformOrigin(),
            isVisible = _isVisible.call(self);

        if (!isVisible || self.data.bound) {// if the croppie isn't visible or it doesn't need binding
            return;
        }

        self.data.bound = true;
        cssReset[CSS_TRANSFORM] = transformReset.toString();
        cssReset[CSS_TRANS_ORG] = originReset.toString();
        cssReset['opacity'] = 1;
        css(img, cssReset);

        imgData = self.elements.preview.getBoundingClientRect();

        self._originalImageWidth = imgData.width;
        self._originalImageHeight = imgData.height;
        self.data.orientation = _hasExif.call(self) ? getExifOrientation(self.elements.img) : self.data.orientation;

        if (self.options.enableZoom) {
            _updateZoomLimits.call(self, true);
        }
        else {
            self._currentZoom = initialZoom;
        }

        transformReset.scale = self._currentZoom;
        cssReset[CSS_TRANSFORM] = transformReset.toString();
        css(img, cssReset);

        if (self.data.points.length) {
            _bindPoints.call(self, self.data.points);
        }
        else {
            _centerImage.call(self);
        }

        _updateCenterPoint.call(self);
        _updateOverlay.call(self);
    }

    function _updateZoomLimits (initial) {
        var self = this,
            minZoom = Math.max(self.options.minZoom, 0) || 0,
            maxZoom = self.options.maxZoom || 1.5,
            initialZoom,
            defaultInitialZoom,
            zoomer = self.elements.zoomer,
            scale = parseFloat(zoomer.value),
            boundaryData = self.elements.boundary.getBoundingClientRect(),
            imgData = naturalImageDimensions(self.elements.img, self.data.orientation),
            vpData = self.elements.viewport.getBoundingClientRect(),
            minW,
            minH;
        if (self.options.enforceBoundary) {
            minW = vpData.width / imgData.width;
            minH = vpData.height / imgData.height;
            minZoom = Math.max(minW, minH);
        }

        if (minZoom >= maxZoom) {
            maxZoom = minZoom + 1;
        }
        var min = fix(minZoom, 4);
        console.log('zoomer min:');
        console.log(min);
        zoomer.min = min;
        zoomer.max = fix(maxZoom, 4);

        if (!initial && (scale < zoomer.min || scale > zoomer.max)) {
            _setZoomerVal.call(self, scale < zoomer.min ? zoomer.min : zoomer.max);
        }
        else if (initial) {
            // defaultInitialZoom = self.options.initialZoom ? self.options.initialZoom : Math.max((boundaryData.width / imgData.width), (boundaryData.height / imgData.height));
            defaultInitialZoom = Math.max((boundaryData.width / imgData.width), (boundaryData.height / imgData.height));
            initialZoom = self.data.boundZoom !== null ? self.data.boundZoom : defaultInitialZoom;
            _setZoomerVal.call(self, initialZoom);
        }

        dispatchChange(zoomer);
    }

    function _bindPoints(points) {
        if (points.length !== 4) {
            throw "Croppie - Invalid number of points supplied: " + points;
        }
        var self = this,
            pointsWidth = points[2] - points[0],
            // pointsHeight = points[3] - points[1],
            vpData = self.elements.viewport.getBoundingClientRect(),
            boundRect = self.elements.boundary.getBoundingClientRect(),
            vpOffset = {
                left: vpData.left - boundRect.left,
                top: vpData.top - boundRect.top
            },
            scale = vpData.width / pointsWidth,
            originTop = points[1],
            originLeft = points[0],
            transformTop = (-1 * points[1]) + vpOffset.top,
            transformLeft = (-1 * points[0]) + vpOffset.left,
            newCss = {};

        newCss[CSS_TRANS_ORG] = originLeft + 'px ' + originTop + 'px';
        newCss[CSS_TRANSFORM] = new Transform(transformLeft, transformTop, scale).toString();
        css(self.elements.preview, newCss);

        _setZoomerVal.call(self, scale);
        self._currentZoom = scale;
    }

    function _centerImage() {
        var self = this,
            imgDim = self.elements.preview.getBoundingClientRect(),
            vpDim = self.elements.viewport.getBoundingClientRect(),
            boundDim = self.elements.boundary.getBoundingClientRect(),
            vpLeft = vpDim.left - boundDim.left,
            vpTop = vpDim.top - boundDim.top,
            w = vpLeft - ((imgDim.width - vpDim.width) / 2),
            h = vpTop - ((imgDim.height - vpDim.height) / 2),
            transform = new Transform(w, h, self._currentZoom);

        css(self.elements.preview, CSS_TRANSFORM, transform.toString());
    }

    function _transferImageToCanvas(customOrientation) {
        var self = this,
            canvas = self.elements.canvas,
            img = self.elements.img,
            ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = img.width;
        canvas.height = img.height;

        var orientation = self.options.enableOrientation && customOrientation || getExifOrientation(img);
        drawCanvas(canvas, img, orientation);
    }

    function _getCanvas(data) {
        var self = this,
            points = data.points,
            left = num(points[0]),
            top = num(points[1]),
            right = num(points[2]),
            bottom = num(points[3]),
            width = right-left,
            height = bottom-top,
            circle = data.circle,
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            startX = 0,
            startY = 0,
            canvasWidth = data.outputWidth || width,
            canvasHeight = data.outputHeight || height;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        if (data.backgroundColor) {
            ctx.fillStyle = data.backgroundColor;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        // By default assume we're going to draw the entire
        // source image onto the destination canvas.
        var sx = left,
            sy = top,
            sWidth = width,
            sHeight = height,
            dx = 0,
            dy = 0,
            dWidth = canvasWidth,
            dHeight = canvasHeight;

        //
        // Do not go outside of the original image's bounds along the x-axis.
        // Handle translations when projecting onto the destination canvas.
        //

        // The smallest possible source x-position is 0.
        if (left < 0) {
            sx = 0;
            dx = (Math.abs(left) / width) * canvasWidth;
        }

        // The largest possible source width is the original image's width.
        if (sWidth + sx > self._originalImageWidth) {
            sWidth = self._originalImageWidth - sx;
            dWidth =  (sWidth / width) * canvasWidth;
        }

        //
        // Do not go outside of the original image's bounds along the y-axis.
        //

        // The smallest possible source y-position is 0.
        if (top < 0) {
            sy = 0;
            dy = (Math.abs(top) / height) * canvasHeight;
        }

        // The largest possible source height is the original image's height.
        if (sHeight + sy > self._originalImageHeight) {
            sHeight = self._originalImageHeight - sy;
            dHeight = (sHeight / height) * canvasHeight;
        }

        // console.table({ left, right, top, bottom, canvasWidth, canvasHeight, width, height, startX, startY, circle, sx, sy, dx, dy, sWidth, sHeight, dWidth, dHeight });

        ctx.drawImage(this.elements.preview, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        if (circle) {
            ctx.fillStyle = '#fff';
            ctx.globalCompositeOperation = 'destination-in';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }
        return canvas;
    }

    function _getHtmlResult(data) {
        var points = data.points;
        var  div = document.createElement('div');
        var  img = document.createElement('img');
            width = points[2] - points[0],
            height = points[3] - points[1];

        addClass(div, 'croppie-result');
        div.appendChild(img);
        css(img, {
            left: (-1 * points[0]) + 'px',
            top: (-1 * points[1]) + 'px'
        });
        img.src = data.url;
        css(div, {
            width: width + 'px',
            height: height + 'px'
        });

        return div;
    }

    function _getBase64Result(data) {
        return _getCanvas.call(this, data).toDataURL(data.format, data.quality);
    }

    function _getBlobResult(data) {
        var self = this;
        return new Promise(function (resolve) {
            _getCanvas.call(self, data).toBlob(function (blob) {
                resolve(blob);
            }, data.format, data.quality);
        });
    }

    function _replaceImage(img) {
        if (this.elements.img.parentNode) {
            Array.prototype.forEach.call(this.elements.img.classList, function(c) { img.classList.add(c); });
            this.elements.img.parentNode.replaceChild(img, this.elements.img);
            this.elements.preview = img; // if the img is attached to the DOM, they're not using the canvas
        }
        this.elements.img = img;
    }

    function _bind(options, cb) {
        var self = this,
            url,
            points = [],
            zoom = null,
            hasExif = _hasExif.call(self);

        if (typeof (options) === 'string') {
            url = options;
            options = {};
        }
        else if (Array.isArray(options)) {
            points = options.slice();
        }
        else if (typeof (options) === 'undefined' && self.data.url) { //refreshing
            _updatePropertiesFromImage.call(self);
            _triggerUpdate.call(self);
            return null;
        }
        else {
            url = options.url;
            points = options.points || [];
            zoom = typeof(options.zoom) === 'undefined' ? null : options.zoom;
        }

        self.data.bound = false;
        self.data.url = url || self.data.url;
        self.data.boundZoom = zoom;

        return loadImage(url, hasExif).then(function (img) {
            _replaceImage.call(self, img);
            if (!points.length) {
                var natDim = naturalImageDimensions(img);
                var rect = self.elements.viewport.getBoundingClientRect();
                var aspectRatio = rect.width / rect.height;
                var imgAspectRatio = natDim.width / natDim.height;
                var width, height;

                if (imgAspectRatio > aspectRatio) {
                    height = natDim.height;
                    width = height * aspectRatio;
                }
                else {
                    width = natDim.width;
                    height = natDim.height / aspectRatio;
                }

                var x0 = (natDim.width - width) / 2;
                var y0 = (natDim.height - height) / 2;
                var x1 = x0 + width;
                var y1 = y0 + height;
                self.data.points = [x0, y0, x1, y1];
            }
            else if (self.options.relative) {
                points = [
                    points[0] * img.naturalWidth / 100,
                    points[1] * img.naturalHeight / 100,
                    points[2] * img.naturalWidth / 100,
                    points[3] * img.naturalHeight / 100
                ];
            }

            self.data.orientation = options.orientation || 1;
            self.data.points = points.map(function (p) {
                return parseFloat(p);
            });
            if (self.options.useCanvas) {
                _transferImageToCanvas.call(self, self.data.orientation);
            }
            _updatePropertiesFromImage.call(self);
            _triggerUpdate.call(self);
            cb && cb();
        });
    }

    function fix(v, decimalPoints) {
        return parseFloat(v).toFixed(decimalPoints || 0);
    }

    function _get() {
        var self = this,
            imgData = self.elements.preview.getBoundingClientRect(),
            vpData = self.elements.viewport.getBoundingClientRect(),
            x1 = vpData.left - imgData.left,
            y1 = vpData.top - imgData.top,
            widthDiff = (vpData.width - self.elements.viewport.offsetWidth) / 2, //border
            heightDiff = (vpData.height - self.elements.viewport.offsetHeight) / 2,
            x2 = x1 + self.elements.viewport.offsetWidth + widthDiff,
            y2 = y1 + self.elements.viewport.offsetHeight + heightDiff,
            scale = self._currentZoom;

        if (scale === Infinity || isNaN(scale)) {
            scale = 1;
        }

        var max = self.options.enforceBoundary ? 0 : Number.NEGATIVE_INFINITY;
        x1 = Math.max(max, x1 / scale);
        y1 = Math.max(max, y1 / scale);
        x2 = Math.max(max, x2 / scale);
        y2 = Math.max(max, y2 / scale);

        return {
            points: [fix(x1), fix(y1), fix(x2), fix(y2)],
            zoom: scale,
            orientation: self.data.orientation
        };
    }

    var RESULT_DEFAULTS = {
            type: 'canvas',
            format: 'png',
            quality: 1
        },
        RESULT_FORMATS = ['jpeg', 'webp', 'png'];

    function _result(options) {
        var self = this,
            data = _get.call(self),
            opts = deepExtend(clone(RESULT_DEFAULTS), clone(options)),
            resultType = (typeof (options) === 'string' ? options : (opts.type || 'base64')),
            size = opts.size || 'viewport',
            format = opts.format,
            quality = opts.quality,
            backgroundColor = opts.backgroundColor,
            circle = typeof opts.circle === 'boolean' ? opts.circle : (self.options.viewport.type === 'circle'),
            vpRect = self.elements.viewport.getBoundingClientRect(),
            ratio = vpRect.width / vpRect.height,
            prom;

        if (size === 'viewport') {
            data.outputWidth = vpRect.width;
            data.outputHeight = vpRect.height;
        } else if (typeof size === 'object') {
            if (size.width && size.height) {
                data.outputWidth = size.width;
                data.outputHeight = size.height;
            } else if (size.width) {
                data.outputWidth = size.width;
                data.outputHeight = size.width / ratio;
            } else if (size.height) {
                data.outputWidth = size.height * ratio;
                data.outputHeight = size.height;
            }
        }

        if (RESULT_FORMATS.indexOf(format) > -1) {
            data.format = 'image/' + format;
            data.quality = quality;
        }

        data.circle = circle;
        data.url = self.data.url;
        data.backgroundColor = backgroundColor;

        prom = new Promise(function (resolve) {
            switch(resultType.toLowerCase())
            {
                case 'rawcanvas':
                    resolve(_getCanvas.call(self, data));
                    break;
                case 'canvas':
                case 'base64':
                    resolve(_getBase64Result.call(self, data));
                    break;
                case 'blob':
                    _getBlobResult.call(self, data).then(resolve);
                    break;
                default:
                    resolve(_getHtmlResult.call(self, data));
                    break;
            }
        });
        return prom;
    }

    function _refresh() {
        _updatePropertiesFromImage.call(this);
    }

    function _rotate(deg) {
        if (!this.options.useCanvas || !this.options.enableOrientation) {
            throw 'Croppie: Cannot rotate without enableOrientation && EXIF.js included';
        }

        var self = this,
            canvas = self.elements.canvas;

        self.data.orientation = getExifOffset(self.data.orientation, deg);
        drawCanvas(canvas, self.elements.img, self.data.orientation);
        _updateCenterPoint.call(self, true);
        _updateZoomLimits.call(self);

        // Reverses image dimensions if the degrees of rotation is not divisible by 180.
        if ((Math.abs(deg) / 90) % 2 === 1) {
            let oldHeight = self._originalImageHeight;
            let oldWidth = self._originalImageWidth;
            self._originalImageWidth = oldHeight;
            self._originalImageHeight = oldWidth;
        }
    }

    function _destroy() {
        var self = this;
        self.element.removeChild(self.elements.boundary);
        removeClass(self.element, 'croppie-container');
        if (self.options.enableZoom) {
            self.element.removeChild(self.elements.zoomerWrap);
        }
        delete self.elements;
    }

    if (typeof window !== 'undefined' && window.jQuery) {
        var $ = window.jQuery;
        $.fn.croppie = function (opts) {
            var ot = typeof opts;

            if (ot === 'string') {
                var args = Array.prototype.slice.call(arguments, 1);
                var singleInst = $(this).data('croppie');

                if (opts === 'get') {
                    return singleInst.get();
                }
                else if (opts === 'result') {
                    return singleInst.result.apply(singleInst, args);
                }
                else if (opts === 'bind') {
                    return singleInst.bind.apply(singleInst, args);
                }

                return this.each(function () {
                    var i = $(this).data('croppie');
                    if (!i) return;

                    var method = i[opts];
                    if ($.isFunction(method)) {
                        method.apply(i, args);
                        if (opts === 'destroy') {
                            $(this).removeData('croppie');
                        }
                    }
                    else {
                        throw 'Croppie ' + opts + ' method not found';
                    }
                });
            }
            else {
                return this.each(function () {
                    var i = new Croppie(this, opts);
                    i.$ = $;
                    $(this).data('croppie', i);
                });
            }
        };
    }

    function Croppie(element, opts) {
        if (element.className.indexOf('croppie-container') > -1) {
            throw new Error("Croppie: Can't initialize croppie more than once");
        }
        this.element = element;
        this.options = deepExtend(clone(Croppie.defaults), opts);

        if (this.element.tagName.toLowerCase() === 'img') {
            var origImage = this.element;
            addClass(origImage, 'cr-original-image');
            setAttributes(origImage, {'aria-hidden' : 'true', 'alt' : '' });
            var replacementDiv = document.createElement('div');
            this.element.parentNode.appendChild(replacementDiv);
            replacementDiv.appendChild(origImage);
            this.element = replacementDiv;
            this.options.url = this.options.url || origImage.src;
        }

        _create.call(this);
        if (this.options.url) {
            var bindOpts = {
                url: this.options.url,
                points: this.options.points
            };
            delete this.options['url'];
            delete this.options['points'];
            _bind.call(this, bindOpts);
        }
    }

    Croppie.defaults = {
        viewport: {
            width: 100,
            height: 100,
            type: 'square'
        },
        boundary: { },
        orientationControls: {
            enabled: true,
            leftClass: '',
            rightClass: ''
        },
        resizeControls: {
            width: true,
            height: true
        },
        customClass: '',
        showZoomer: true,
        enableZoom: true,
        enableResize: false,
        mouseWheelZoom: true,
        enableExif: false,
        enforceBoundary: true,
        enableOrientation: false,
        enableKeyMovement: true,
        update: function () { }
    };

    Croppie.globals = {
        translate: 'translate3d'
    };

    deepExtend(Croppie.prototype, {
        bind: function (options, cb) {
            return _bind.call(this, options, cb);
        },
        get: function () {
            var data = _get.call(this);
            var points = data.points;
            if (this.options.relative) {
                points[0] /= this.elements.img.naturalWidth / 100;
                points[1] /= this.elements.img.naturalHeight / 100;
                points[2] /= this.elements.img.naturalWidth / 100;
                points[3] /= this.elements.img.naturalHeight / 100;
            }
            return data;
        },
        result: function (type) {
            return _result.call(this, type);
        },
        refresh: function () {
            return _refresh.call(this);
        },
        setZoom: function (v) {
            _setZoomerVal.call(this, v);
            dispatchChange(this.elements.zoomer);
        },
        rotate: function (deg) {
            _rotate.call(this, deg);
        },
        destroy: function () {
            return _destroy.call(this);
        }
    });
    return Croppie;
}));



define('format-converter',[],function(){

    var FormatConverter = {

      /**
       * Converts base64 data into a Blob.
       * @param  {[type]} base64 [description]
       * @param  {[type]} mime   [description]
       * @return {Blob}        [description]
       */
      base64ToBlob:function(base64, mime){
          mime = mime || '';
          base64 = base64.replace(/^data:.*;base64,/, "");
          var sliceSize = 1024;
          var byteChars = window.atob(base64);
          var byteArrays = [];

          for (var offset = 0, len = byteChars.length; offset < len; offset += sliceSize) {
              var slice = byteChars.slice(offset, offset + sliceSize);

              var byteNumbers = new Array(slice.length);
              for (var i = 0; i < slice.length; i++) {
                  byteNumbers[i] = slice.charCodeAt(i);
              }

              var byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
          }

          return new Blob(byteArrays, {type: mime});
      }
    }

  return FormatConverter;
})
;
define('text-utilities',[], function(){
  var ENTER_KEY = 13;
  var TAB_KEY = 9;

  var TextUtilities = function(){}

  TextUtilities.onKeyPress = function(e){
    var code = e.keyCode;
    if(code == TAB_KEY){
      e.preventDefault();
      this.insertTab(e.target);
      return false;
    }
    else if(e.shiftKey && code == ENTER_KEY){
      return true; // go to new line.
    }
    else if(code == ENTER_KEY){
      if(!e.send || typeof e.send != 'function'){
        throw new Error('send function must be attached to event.');
      }
      e.send();
    }
    else{
      return true;
    }
  }

  TextUtilities.insertTab = function(target){
      var start = target.selectionStart;
      var end = target.selectionEnd;
      var cursorPrefix = target.value.substring(0, start);
      var tab = "\t";
      var cursorPostfix = target.value.substring(end);
      target.selectionStart = target.selectionEnd = start + 1;
      target.value = cursorPrefix + tab + cursorPostfix;
    }


    TextUtilities.formatToHTML = function(text){
      text = TextUtilities.escapeHTML(text);
      text = TextUtilities.insertLineBreaks(text);
      return TextUtilities.insertHTMLTabs(text);
    }

    TextUtilities.escapeHTML = function(str){
      var after = str.replace(/[&<>"]/g, function (tag) {
        var chars_to_replace = {
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&apos;'
          };
          return chars_to_replace[tag] || tag;
      });
      return after;
    }
    
  TextUtilities.insertLineBreaks = function(text){
      var lines = text.split(/\n/gm);
      var messageWithBreaks = '';
      for(var i = 0; i < lines.length; i++){
        if(i < lines.length - 1){
            messageWithBreaks += lines[i] + '<br>';
        }
        else{
            messageWithBreaks += lines[i];
        }
      }
      return messageWithBreaks;
    }


  TextUtilities.insertHTMLTabs = function(text){
      var lines = text.split(/\t/gm);
      var withTabs = '';
      for(var i = 0; i < lines.length; i++){
        if(i == lines.length - 1 && lines[i] == ''){
          break;
        }
        withTabs += lines[i] + '\u00A0\u00A0\u00A0\u00A0';
      }
      return withTabs;
    }


  TextUtilities.wrapLinks = function(text, styleClass){
      if(/iframe/.test(text) == true){
        return text;
      }
      let regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
      if(regex.test(text)){
          var match = (text.match(regex))[0];
          var replacement = '<a target="_blank" ' +
                               'class="' + styleClass + '" ' +
                               'href="'  + match + '">' +
                                match
                          + '</a>';
          text = text.replace(match, replacement);
      }
      return text;
    }


return TextUtilities;
});

/**
 *  Used for closing a widget when the user clicks somewhere else on the document.
 *
 *  element should be an ancester of all elements in the widget
 *
 * valueAccessor must be a function that executes the closing of the widget
 * (this closing function should be defined in the view model.)
 *
 */
define('complementClick',['ko','jquery'],function(ko,$){

  ko.bindingHandlers.complementClick = {


    init :  function(element,valueAccessor,allBindings,viewModel){

        var $e = $(element);

        $(document).mouseup(function(event){
          var $target = $(event.target);
          var matchCount = $target.closest($e).length;
          if(matchCount > 0){
            return true;
          }
          else {
            // no child of the menu was clicked (nor the menu its self.).
            var callback = valueAccessor(); // returns the argument that was passed to the binding.
            callback();
          }
        });
    },

    update: function(element,valueAccessor,allBindings,viewModel){


    }
  };
});

define('sliderValue',['ko','jquery'],function(ko,$){


  ko.bindingHandlers.sliderValue = {
    // Init, runs on initialization
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext)  {
      if ( ko.isObservable(valueAccessor()) && (element instanceof HTMLInputElement) && (element.type === "range") )
      {
        // Add event listener to the slider, this will update the observable on input (just moving the slider),
        // Otherwise, you have to move the slider then release it for the value to change
        element.addEventListener('input', function(){
          // Update the observable
          if (ko.unwrap(valueAccessor()) != element.value)
          {
            valueAccessor()(element.value);

            // Trigger the change event, awesome fix that makes
            // changing a dropdown and a range slider function the same way
            element.dispatchEvent(new Event('change'));
          }
        }); // End event listener
      }

    }, // End init

    // Update, runs whenever observables for this binding change(and on initialization)
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
      // Make sure the parameter passed is an observable
      if ( ko.isObservable(valueAccessor()) && (element instanceof HTMLInputElement) && (element.type === "range") )
      {
        // Update the slider value (so if the value changes programatically, the slider will update)
        if (element.value != ko.unwrap(valueAccessor()))
        {
          element.value = ko.unwrap(valueAccessor());
          element.dispatchEvent(new Event('input'));
        }
      }
    } // End update

  }; // End sliderValue

});


define('dispatcher/Dispatcher',[],
function(){
  // private and only one instance of this.
  var _callbacks = [];
  var _idCounter = 0;
  var _orderedNames = [];

  var Dispatcher = function(){

    this.reg = function(name, callback){
      if(!name || typeof name != 'string' || name.length < 2){
        throw new Error('name must be a non-empty string.');
      }
      if(!callback || typeof callback != 'function'){
        throw new Error('callback must be a function.');
      }
      var callbacksId = _idCounter;
      _callbacks.push({
        name:name,
        callback:callback,
        id:callbacksId
      });
      _idCounter++;
      return callbacksId;
    }

    this.getCallback = function(name){
      var cbs = _callbacks;
      for(var i = 0; i < cbs.length; i++){
        if(cbs[i].name == name){
          return cbs[i].callback;
        }
      }
    }

    this.getCallbackById = function(id){
      if(isNaN(id) || id < 0){
        throw new Error('id must be a positive integer.');
      }
      var cbs = _callbacks;
      for(var i = 0; i < cbs.length; i++){
        if(cbs[i].id == id){
          return cbs[i].callback;
        }
      }
    }

    /**
      moves all the actions with 'name'
      to the front so that are dispatched first.
    */
    this.waitFor = function(name){
      var tmp = [];

      for(var i = 0; i < _callbacks.length; i++){
        var c =  _callbacks[i];
        if(name == c.name){
          tmp.push(c);
        }
      }

      _callbacks = array.filter(function(value, index, arr){
        return value.name == name;
      });

      tmp.forEach(function(t){
        _callbacks.unshift(t);
      })
    }



    this.dispatch = function(name, data){
      for(var i = 0; i < _callbacks.length; i++){
        if(_callbacks[i].name == name){
          _callbacks[i].callback(data);
        }
      }
    }





};

  return Dispatcher;
});


define('enterKey',['ko'],function(ko){
  ko.bindingHandlers.enterKey = {
    init :  function(element,valueAccessor,allBindings,viewModel){
      var callBack = valueAccessor();
     // alert(callBack);
     // alert(element);
  //adsdfadsdf does not work.
      $(element).keypress(function(event){

        var keyCode = (event.which ? event.which : event.keyCode);

        if(keyCode === 13){
          //console.log(keyCode);
          //console.log($(element).text());
          callBack.call(viewModel);

          return false;
        }
        return true;
      });
    }
  };
});


define('RootViewModel',['ko','enterKey', 'postbox', "jquery",'complementClick'],
function(ko, enterKey, postbox, $, complementClick){


  ko.options.deferUpdates = true;

  ko.components.register('environment',    {require:'environment/Component'});
  ko.components.register('auth',                  {require:'auth/AuthViewModel'});


  ko.components.register('profile-setter',        {require:'profile-setter/ViewModel'});
  ko.components.register('user-info',             {require:'user-info/Component'});
  ko.components.register('profile-webcam',        {require:'webcam/Component'});
  ko.components.register('permission-error',      {require:'permission-error/Component'});
  ko.components.register('photo-controls',        {require:'photo-controls/Component'});

  ko.components.register('banner',                {require:'banner/ViewModel'});
  ko.components.register('notification',          {require:'notification/Component'});


  ko.components.register('search',                {require:'search/Component'});
  ko.components.register('group-title',          {require:'group-title/Component'});

  // people.
  ko.components.register('pal-list',          {require:'pal-list/Component'});
  ko.components.register('pal-request-list',  {require:'pal-request-list/Component'});
  ko.components.register('class-list',       {require:'class-list/Component'});
  ko.components.register('people-popups',       {require:'people-popups/Component'});


  ko.components.register('course-controls',       {require:'course-controls/Component'});
    ko.components.register('non-member-prompt',   {require:'non-member-prompt/Component'});
    ko.components.register('in-another-section-prompt',   {require:'in-another-section-prompt/Component'});
    ko.components.register('forum',               {require:'forum/Component'});
    ko.components.register('course-settings',      {require:'course-settings/Component'});
    ko.components.register('practice-tests',      {require:'practice-tests/Component'});


  // one on one stuff.
  ko.components.register('chat-widget',           {require:'chat/ViewModel'});
  ko.components.register('blackboard',            {require:'blackboard/ViewModel'});



  ko.components.register('right-panel',     {require:'right-panel/Component'});

    ko.components.register('current-courses', {require:'right-panel/current-courses/Component'});

    ko.components.register('pre-view',       {require:'right-panel/ad-views/pre-view/Component'});
      ko.components.register('lead-view',       {require:'right-panel/ad-views/lead-view/Component'});

    ko.components.register('course-info',     {require:'right-panel/course-info/Component'});
      ko.components.register('course-photos',        {require:'right-panel/course-info/course-photos/Component'});
      ko.components.register('course-text-info',     {require:'right-panel/course-info/text-info/Component'});


    ko.components.register('file-dropper',    {require:'right-panel/file-dropper/Component'});

    ko.components.register('person-info',     {require:'right-panel/person-info/Component'});
      ko.components.register('call-buttons',    {require:'right-panel/person-info/call-buttons/Component'});

    ko.components.register('video-chat',      {require:'right-panel/video-chat/Component'});
      ko.components.register('call-dialog',     {require:'right-panel/video-chat/call-dialog/Component'});



  return function RootViewModel(){
  };
});

define('RemoteService',['socketio','dispatcher/Dispatcher'],
function(io, Dispatcher){

  var RemoteService = function(){

  this.proto = Object.getPrototypeOf(this);
  this.io = io;
  this.sock = null;
  this.dis = new Dispatcher();

  this._domain = '';

  this.getConstructorName = function(){
    return "RemoteService";
  }


    this.getScheme = function(){
      return this._scheme;
    }

    this.setScheme = function(scheme){
      this._scheme = scheme;
    }
    this.getHost = function(){
      return this._host;
    }

    this.setHost = function(host){
      this._host = host + ".";
    }

    this.setMicroServer = function(microServer){
      if(microServer){
          this._microServer = microServer + '.';
      }

    }

    this.getMicroServer = function(){
      return this._microServer;
    }

    this.setDomain = function(domain){
      if(String(domain).length < 1){
        this._domain = '';
      }
      else{
        this._domain = domain;
      }
    }

    this.getDomain = function(){
      return this._domain;
    }


    this.setPath = function(path){
      if(String(path).length < 1){
        this._path = '';
      }
      else{
          this._path = '/' + path;
      }
    }

    this.getPath = function(){
      return this._path;
    }


  this.setPort = function(port){
    if(String(port).length < 1){
      this._port = port;
    }
    else{
      this._port = ":" + port;
    }
  }

  this.getPort = function(){
    return this._port;
  }

  /**
      sets the socket using the accessToken
      and the server url.

      pre: microserver must be set beforehand.
  */
  this.setSock = function(f){
    if(!this.sock){
      var token = this.getAccessToken();
      var url = this.getServerURL();
      var opt = {
        autoConnect:true,
        reconnection:true,
        query: {token: token}
      };
      this.sock = this.io(url,opt);
      if(typeof f == 'function'){
        f();
      }
    }
  }







  this.getServerURL = function(){

    return this.getScheme() +
           this.getHost() +
           this.getMicroServer() +
           this.getDomain() +
           this.getPort() +
           this.getPath();
  }

  /**
   * Sets the authorization header  Or
   * throws an exception if the token is not set.
   * @return {string} The accessToken for this user.
   */
  this.setAuthorizationHeader = function(xhr){
    var token = this.getAccessToken();
    if(!token){
      throw new Error('accessToken must be set.');
    }
    xhr.setRequestHeader('authorization',token);
  }
  this.setAuthorizationHeader = this.setAuthorizationHeader.bind(this);

  this.missingCookiesMessage =  "This site required cookies because it enables enhanced user experience.  Please change your browsers settings to allow cookies for this site.";

  this.getAccessToken = function(){
    try{
      var token = localStorage.getItem('accessToken');
      if(!token || token.length <= 0){
        throw new Error("accessToken must be a non-empty string.");
      }
      return token;
    }
    catch(err){
      console.log(err);
      alert(this.missingCookiesMessage);
    }
  }
  this.getAccessToken = this.getAccessToken.bind(this);



  this.setAccessToken = function(token){
    try{
      localStorage.setItem('accessToken',token);
    }
    catch(err){
      alert(this.missingCookiesMessage);
    }
  }
  this.setAccessToken = this.setAccessToken.bind(this);

  this.setFakeToken = function(){
    this.setAccessToken('fakeToken');
  }


  this.deleteToken = function(){
    try{
      window.localStorage.removeItem('accessToken');
    }
    catch(err){
      alert(this.missingCookiesMessage);
    }
  }


  }

  return RemoteService;
})
;
define('ActiveRemoteService',['RemoteService'],
function(RemoteService){

  var DevelopmentRemoteService = function(){

  Object.setPrototypeOf(this, new RemoteService());

  this._scheme = 'http://';
  this._host = '';
  this._microServer = '';
  this._domain = 'localhost';
  this._port = '';
  this._path = '';

  this.getConstructorName = function(){
    return "DevelopmentRemoteService";
  }

  }

  return DevelopmentRemoteService;
})
;

define('user/ProfileRemoteService',['ActiveRemoteService',
        'format-converter',
        'dispatcher/Dispatcher'],
function(ActiveRemoteService,
         FormatConverter,
         Dispatcher){

  var ProfileRemoteService = function(){
      Object.setPrototypeOf(Object.getPrototypeOf(this),new ActiveRemoteService());
      this.setMicroServer("profile");
      this.dis = new Dispatcher();


      this.getProfileInfo = function(){
        var self = this;
        var url = this.getServerURL() + '/getProfileInfo';
        $.ajax({
          url:url,
          type:"GET",
          cache:false,
          contentType:"application/x-www-form-urlencoded; charset=UTF-8",
          beforeSend:this.setAuthorizationHeader,
          success:function(json){
            var info = JSON.parse(json);
            self.dis.dispatch('profileUpdate',self.setServerUrl(info));
          },
          error:function(jq,status,err){
            console.log(err);
          }
        })
      }
      this.getProfileInfo = this.getProfileInfo.bind(this);


      /**
          handles what happens when the user is authenticated.
      */
      this.onAuthChange = function(update){
        if(update.state == 'authenticated'){
          this.getProfileInfo();
        }
      }
      this.onAuthChange = this.onAuthChange.bind(this);
      this.onAuthId = this.dis.reg('authState', this.onAuthChange);



      this.setServerUrl = function(info){
        var urlPrefix = this.getServerURL();
        if(info.large_photo_url){
           info.large_photo_url = urlPrefix + '/' + info.large_photo_url;
        }
        if(info.small_photo_url){
           info.small_photo_url = urlPrefix + '/' + info.small_photo_url;
        }
        return info;
      }


      /**
       * @param  {[type]} imageData is the image in base64 format.
       * @param {Function} callback is called on successful upload of the imageData.
       */
      this.saveCroppedPhoto = function(img){
        if(!img || typeof img != 'string' || img.length < 1){
          throw new Error('object of img must be passed as an argument.');
        }
        var formData = this.makeForm(img);
        var self = this;
        $.ajax({
          url:this.getServerURL() + '/updatePhoto',
          type:"POST",
          cache:false,
          contentType:false,
          processData:false,
          data:formData,
          beforeSend:this.setAuthorizationHeader,
          success:function(){
            self.getProfileInfo();
          },
          error:function(ajax,status,err){
            console.log("No Face error?");
            console.log(ajax);
            if(ajax.responseText == "NoFace"){
              self.dis.dispatch('updatePhotoNoFaceError');
            }
            else{
              self.onPhotoUploadError(err);
            }
          }
        })
      }
      this.saveCroppedPhoto = this.saveCroppedPhoto.bind(this);
      this.saveCroppedPhotoId = this.dis.reg('saveCroppedPhoto', this.saveCroppedPhoto);



      this.registerOnPhotoUploadError = function(fn){
        this.onPhotoUploadError = fn;
      }


      this.makeForm = function(imageData){
        var formData = new FormData();
        if(imageData){
          var base64Data = imageData;
          var blob = FormatConverter.base64ToBlob(base64Data, 'image/png');
          formData.append('image', blob);
        }
        return formData;
      }


      this.saveMyInfo = function(obj){
        var url = this.getServerURL() + '/saveMyInfo'
        var self = this
        $.ajax({
          url:url,
          beforeSend:this.setAuthorizationHeader,
          type:'POST',
          data:obj,
          success:function(){
            self.getProfileInfo()
          },
          error:function(a, b, err){
            console.log(err);
          }
        })
      }
      this.saveMyInfo = this.saveMyInfo.bind(this)
      this.saveBdId = this.dis.reg('saveMyInfo',this.saveMyInfo)

      this.saveAboutMe = function(text){
        var url = this.getServerURL() + '/saveAboutMe';
        $.ajax({
          url:url,
          beforeSend:this.setAuthorizationHeader,
          type:'POST',
          data:{text:text},
          success:this.getProfileInfo,
          error:function(a, b, err){
            console.log(err);
          }
        })
      }
      this.saveAboutMe = this.saveAboutMe.bind(this);
      this.saveAboutId = this.dis.reg('aboutMe', this.saveAboutMe);


      this.setYearOfStudy = function(year){
        var url = this.getServerURL() + '/yearOfStudy/' + year;
        var self = this;
        $.ajax({
          url:url,
          beforeSend:this.setAuthorizationHeader,
          type:'POST',
          success:this.getProfileInfo,
          error:function(a, b, err){
            console.log(err);
          }
        })
      }
      this.setYearOfStudy = this.setYearOfStudy.bind(this);
      this.setYearId = this.dis.reg('selectYear',this.setYearOfStudy);


      this.getMajors = function(input){
        if(!input || typeof input != 'string'){
          throw new Error('input must be a non-empty string.');
        }
        var url = this.getServerURL() + '/majors/' + input;
        var self = this;
        $.ajax({
          url:url,
          type:"GET",
          beforeSend:this.setAuthorizationHeader,
          success:function(json){
            var majors = JSON.parse(json);
            self.dis.dispatch('majors',majors);
          },
          error:function(err){
            console.log(err);
          }
        });
      }
      this.getMajors = this.getMajors.bind(this);
      this.getMajorsId = this.dis.reg('getStudentMajors', this.getMajors);



      this.setMajorTo = function(majorId){
        var url = this.getServerURL() + '/major/' + majorId;
        var self = this;
        $.ajax({
          url:url,
          type:'post',
          beforeSend:this.setAuthorizationHeader,
          success:function(majorId){
            self.getProfileInfo();
          },
          error:function(err){
            console.log(err);
          }
        });
      }
      this.setMajorTo = this.setMajorTo.bind(this);
      this.selectMajorId = this.dis.reg('selectMajor', this.setMajorTo);



      this.recordProfileSetterOpened = function(){
        var url = this.getServerURL() + '/profile_setter_opened';
        $.ajax({
          url:url,
          type:'post',
          beforeSend:this.setAuthorizationHeader,
          success:function(){
              // console.log('success');
          },
          error:function(err){
            console.log(err);
          }
        })
      }


      this._checkType = function(cb){
        if(typeof cb != 'function'){
          throw new Error('callback needs to be a function.');
        }
      }
  }
  return ProfileRemoteService;
})
;
define('abstract-interfaces/Store',[],function(){

  var Store = function(){
    this.subs = [];
    this.onPub = null;

    this.pub = function(){
       this.subs.forEach(function(f){
         f();
       });
       if(typeof this.onPub == 'function'){
         this.onPub();
       }
     }
     this.pub = this.pub.bind(this);

     this.onPub = function(f){
       this.onPub = f;
     }
     this.onPub = this.onPub.bind(this);

     this.getDis = function(){
       return this.dis;
     }

     this.sub = function(f){
       this.subs.push(f);
     }

     this.getSubs = function(){
       return this.subs;
     }
  }

  return Store;
})
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('user/profile-setter/states/ProfileState',[],
function(){


  var _isVisible = true;
  var _isPhotoCropperVisible = false;
  var _isWebcamVisible = false;
  var _isSearchingMajors = false;
  var _isSavingPhoto = false;
  var _isNewPhotoLoaded = false;
  var _isFaceErrVisible = false;
  var _isPhotoCropperVisible = false;


  function ProfileState(params, componentInfo){


    this.isVisible = function(){
      return _isVisible;
    }

    this.isPhotoCropperVisible = function(){
      return _isPhotoCropperVisible;
    }

    this.isWebcamVisible = function(){
      return _isWebcamVisible;
    }

    this.isSearchingMajors = function(){
      return _isSearchingMajors;
    }

    this.isSavingPhoto = function(){
      return _isSavingPhoto;
    }

    this.isNewPhotoLoaded = function(){
      return _isNewPhotoLoaded;
    }

    this.isFaceErrorVisible = function(){
      return _isFaceErrVisible;
    }

    this.isPermissionErrorVisible = function(){
      return _isPhotoCropperVisible;
    }

    this.isSavingMyInfo = function(){
      return false
    }



}; // end ProfileState constructor.
return  ProfileState;


}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('user/profile-setter/states/ProfileNotVisible',['user/profile-setter/states/ProfileState'],
function(ProfileState){

  function ProfileNotVisible(){
    // sets the prototype of this to the abstract class ProfileState.
    Object.setPrototypeOf(Object.getPrototypeOf(this), new ProfileState());

    this.isVisible = function(){
      return false;
    }

  }; // end ProfileNotVisible constructor.
return  ProfileNotVisible;

}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('user/profile-setter/states/PhotoCropperVisible',['user/profile-setter/states/ProfileState'],
function(ProfileState){

  function PhotoCropperVisible(params, componentInfo){

    Object.setPrototypeOf(Object.getPrototypeOf(this), new ProfileState());

    this.isPhotoCropperVisible = function(){
      return true;
    }


}; // end PhotoCropperVisible constructor.
return  PhotoCropperVisible;


}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
 define('user/profile-setter/states/SearchingMajors',['user/profile-setter/states/ProfileState'],
 function(ProfileState){

  function SearchingMajors(params, componentInfo){
    Object.setPrototypeOf(Object.getPrototypeOf(this), new ProfileState());
};
return  SearchingMajors;


}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
 define('user/profile-setter/states/WebcamVisible',['user/profile-setter/states/ProfileState'],
 function(ProfileState){

  function WebcamVisible(params, componentInfo){
    Object.setPrototypeOf(Object.getPrototypeOf(this), new ProfileState());

    this.isWebcamVisible = function(){
      return true;
    }
};
return  WebcamVisible;


}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('user/profile-setter/states/NewPhotoUploaded',['user/profile-setter/states/ProfileState'],
function(ProfileState){

  function NewPhotoUploaded(params, componentInfo){

    Object.setPrototypeOf(Object.getPrototypeOf(this), new ProfileState());

    this.isNewPhotoLoaded = function(){
      return true;
    }

    this.isPhotoCropperVisible = function(){
      return true;
    }



}; // end NewPhotoUploaded constructor.
return  NewPhotoUploaded;


}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
 define('user/profile-setter/states/SavingProfilePhoto',['user/profile-setter/states/ProfileState'],
 function(ProfileState){

  function SavingProfilePhoto(params, componentInfo){
    Object.setPrototypeOf(Object.getPrototypeOf(this), new ProfileState());

    this.isSavingPhoto = function(){
      return true;
    }


};
return  SavingProfilePhoto;


}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('user/profile-setter/states/NoFaceError',['user/profile-setter/states/ProfileState'],
function(ProfileState){

  function NoFaceError(){

    Object.setPrototypeOf(Object.getPrototypeOf(this), new ProfileState());

    this.isFaceErrorVisible = function(){
      return true;
    }


}; // end NoFaceError constructor.
return  NoFaceError;


}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('user/profile-setter/states/PermissionError',['user/profile-setter/states/ProfileState'],
function(ProfileState){

  function PermissionError(){

    Object.setPrototypeOf(Object.getPrototypeOf(this), new ProfileState());

    this.isPermissionErrorVisible = function(){
      return true;
    }
}; // end PermissionError constructor.
return  PermissionError;
}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
 define('user/profile-setter/states/SavingMyInfo',['user/profile-setter/states/ProfileState'],
 function(ProfileState){

  function SavingProfilePhoto(params, componentInfo){
    Object.setPrototypeOf(Object.getPrototypeOf(this), new ProfileState());

    this.isSavingMyInfo = function(){
      return true;
    }

    this.isPhotoCropperVisible = function(){
      return true;
    }

};
return  SavingProfilePhoto;


}); // end define.
;

define('user/profile-setter/ProfileStore',['user/ProfileRemoteService',
         'dispatcher/Dispatcher',
         'abstract-interfaces/Store',
         'user/profile-setter/states/ProfileState',
         'user/profile-setter/states/ProfileNotVisible',
         'user/profile-setter/states/PhotoCropperVisible',
         'user/profile-setter/states/SearchingMajors',
         'user/profile-setter/states/WebcamVisible',
         'user/profile-setter/states/NewPhotoUploaded',
         'user/profile-setter/states/SavingProfilePhoto',
         'user/profile-setter/states/NoFaceError',
         'user/profile-setter/states/PermissionError',
         'user/profile-setter/states/SavingMyInfo'],
function(ProfileRemoteService,
         Dispatcher,
         AbstractStore,
         ProfileState,
        ProfileNotVisible,
        PhotoCropperVisible,
        SearchingMajors,
        WebcamVisible,
        NewPhotoUploaded,
        SavingProfilePhoto,
        NoFaceError,
        PermissionError,
        SavingMyInfo){

   new ProfileRemoteService();

   var instance = null

  var ProfileStore = function(){

      Object.setPrototypeOf(this, new AbstractStore())
      this.currentState = new ProfileNotVisible();
      this.userInfo = null;
      this.newPhoto = null;
      this.dis = new Dispatcher();
      this.majors = [];

      this.getUserInfo = function(){
        return this.userInfo;
      }

      this.getMajors = function(){
        return this.majors;
      }

      this.getProfilePhotoUrl = function(){
        return this.userInfo.large_photo_url;
      }

      this.getNewPhoto = function(){
        return this.newPhoto;
      }

      this.getCurrentState = function(){
       return this.currentState;
      }

      this.onEvent = function(event){

       switch(event.action){

         case 'showProfileSetter':
            if(this.currentState instanceof ProfileNotVisible){
              this.currentState = new PhotoCropperVisible();
            }
         break;

         case 'hideProfileSetter':
          if(this.currentState instanceof ProfileState){
            this.currentState = new ProfileNotVisible();
          }
          break;

        case 'searchingMajors':
          if(this.currentState instanceof PhotoCropperVisible){
            this.currentState = new SearchingMajors();
          }
        break;

        case 'showWebcam':
          var showIt = this.currentState instanceof PhotoCropperVisible
                     ||this.currentState instanceof NewPhotoUploaded;
          if(showIt){
            this.currentState = new WebcamVisible();
          }
        break;

        case 'newImgUploaded':
          var s = this.currentState;
          if(s instanceof PhotoCropperVisible || s instanceof NewPhotoUploaded){
            this.newPhoto = event.photo;
            this.currentState = new NewPhotoUploaded();
          }
        break;

        case 'majors':
          if(this.currentState instanceof SearchingMajors){
            this.majors = event.majors;
            this.currentState = new PhotoCropperVisible();
          }
          break;

        case 'webcamCaptured':
          if(this.currentState instanceof WebcamVisible){
            this.newPhoto = event.photo;
            this.currentState = new NewPhotoUploaded();
          }
        break;

        case 'saveProfilePhoto':
          if(this.currentState instanceof NewPhotoUploaded){
            this.currentState = new SavingProfilePhoto();
          }
          break;


          case 'noFaceErr':
            if(this.currentState instanceof SavingProfilePhoto){
              this.currentState = new NoFaceError();
            }
          break;

          case 'croppedPhotoSaved':
            if(this.currentState instanceof SavingProfilePhoto){
              this.currentState = new PhotoCropperVisible();
            }
          break;

          case 'closeNoFaceError':
            if(this.currentState instanceof NoFaceError){
              this.currentState = new PhotoCropperVisible();
            }
          break;

          case 'cameraPermissionError':
            if(this.currentState instanceof WebcamVisible){
              this.currentState = new PermissionError();
            }
          break;

          case 'acknowledgePermissionNeed':
            if(this.currentState instanceof PermissionError){
              this.currentState = new PhotoCropperVisible();
            }
          break;

          case 'profileUpdate':
            this.userInfo = event.update;
            if(this.currentState instanceof SavingProfilePhoto
             || this.currentState instanceof SavingMyInfo){
              this.currentState = new PhotoCropperVisible();
            }
          break;

          case 'saveMyInfo':
            if(this.currentState instanceof PhotoCropperVisible){
              this.currentState = new SavingMyInfo();
            }
          break;

          default:
            // nothing.
       }
       this.pub();
      }
      this.onEvent = this.onEvent.bind(this)

      // adapter.
      /**
      transition over to the more pure flux pattern.
      */
      this.applyAdapter = function(){
        var self = this
       this.dis.reg('showProfileSetter',function(){
         self.onEvent({action:'showProfileSetter'})
       });

      this.dis.reg('hideProfileSetter', function(){
        self.onEvent({action:'hideProfileSetter'});
      });

      this.dis.reg('showWebcam', function(){
        self.onEvent({action:'showWebcam'});
      })

      this.dis.reg('newImgUploaded', function(photo){
        self.onEvent({action:'newImgUploaded', photo:photo});
      });

      this.dis.reg('webcamCaptured', function(photo){
        self.onEvent({action:'webcamCaptured', photo:photo});
      });

      this.dis.reg('profileUpdate', function(userInfo){
        self.onEvent({action:'profileUpdate', update:userInfo});
      });

      this.dis.reg('saveProfilePhoto', function(){
        self.onEvent({action:'saveProfilePhoto'})
      });

      this.dis.reg('saveCroppedPhoto',function(photo){
        self.onEvent({action:'saveCroppedPhoto', photo:photo});
      })

      this.dis.reg('updatePhotoNoFaceError', function(){
        self.onEvent({action:'noFaceErr'});
      });

      this.dis.reg('closeNoFaceError', function(){
        self.onEvent({action:'closeNoFaceError'});
      });

      this.dis.reg('croppedPhotoSaved', function(){
        self.onEvent({action:'croppedPhotoSaved'});
      });

      this.dis.reg('majors', function(majors){
        self.onEvent({action:'majors', majors:majors});
      });

      this.dis.reg('cameraPermissionError', function(){
        self.onEvent({action:'cameraPermissionError'});
      })

      this.dis.reg('acknowledgePermissionNeed', function(){
        self.onEvent({action:'acknowledgePermissionNeed'});
      })

      this.dis.reg('saveMyInfo', function(){
        self.onEvent({action:'saveMyInfo'})
      })


      }
      this.applyAdapter = this.applyAdapter.bind(this)
      this.applyAdapter();

      this.setCurrentState = function(state){
       if(state instanceof ProfileState){
         this.currentState = state;
       }
       else{
         throw new Error('state must be an instance of ProfileState');
       }
      }

    }

return {
    getInstance:function(){
      if(!instance){
        instance = new ProfileStore()
      }
      return instance
    },
    getNew:function(){
      return new ProfileStore()
    }
}


}); // end define.
;

define('text!banner/template.html',[],function () { return '\n<link rel="stylesheet" href="./styles/components/banner/style.css?v=1.0"></link>\n\n\n  <div id="banner-holder"\n       class="row .no-gutters">\n\n\n   <span id="you-button"\n         data-bind="click:openProfileSetter">\n    <img id="profile-photo"\n         data-bind="style:{opacity: smallPhotoUrl().length > 0 ? \'1\' : \'0\'}, attr:{src:smallPhotoUrl()}"\n         src="./assets/no-photo.jpg">\n    </img>\n     <span id="users-name"\n           class="disable-select"\n           data-bind="text:usersName">\n     </span>\n   </span>\n\n   <notification></notification>\n\n\n    <img id="banner-logo"\n         class="disable-select"\n         src="./assets/banner_logo_grey.png">\n    </img>\n\n    <div id="banner_menu"\n         data-bind="complementClick: closeMenu">\n         <button id="banner-menu-btn"\n                 class="dropbtn"\n                 data-bind="click:toggleDropDown">\n\n                <i class="caret"></i>\n         </button>\n\n         <ul id="banner_menu_dropdown_content"\n             data-bind="visible:isMenuVisible">\n\n           <li class="banner_list_item"\n               data-bind="click:openCourseAdder, visible:isAdminButtonVisible()">\n               <button class="banner_menu_button">\n                       create group\n               </button>\n           </li>\n\n\n\n           <li class="banner_list_item"\n               data-bind="click:logOut">\n\n             <button id="logout-btn"\n                     class="banner_menu_button">\n                     Logout\n             </button>\n           </li>\n\n         </ul>\n    </div>\n\n\n\n\n\n  </div>\n';});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */

define('banner/ViewModel',['ko',
        'postbox',
        'text!banner/template.html',
        'jquery',
        'dispatcher/Dispatcher',
        'user/profile-setter/ProfileStore'],
function(ko,
         postbox,
         template,
         $,
         Dispatcher,
         ProfileStore){

  function BannerViewModel(params, componentInfo){

    this.store = ProfileStore.getInstance();

    this.dis = new Dispatcher();
    this.isBannerVisible = ko.observable(false);
    this.usersName = ko.observable('');
    this.smallPhotoUrl = ko.observable('');


    // menu stuff.
    this.isMenuVisible = ko.observable(false);
    this.isAdminButtonVisible = ko.observable(false);
    this.isAdminVisible = ko.observable(false).syncWith('isAdminVisible');


    this.openAdminPanel = function(){
      this.isAdminVisible(true);
      this.isMenuVisible(false);
    }


    this.openCourseAdder = function(){
      this.dis.dispatch('openCourseAdder');
    }



    /**
     * Triggers a broadcast to all subscribers of isImageUploaderVisible.
     */
    this.openProfileSetter = function(c, event){
      this.dis.dispatch('showProfileSetter');
      this.isMenuVisible(false);
      return false;
    }


    this.onAuth = function(update){
      if(update.state == 'authenticated'){
        this._isAuthenticated = true;
        this.isBannerVisible(true);
      }
      else{
        this._isAuthenticated = false;
        this.isBannerVisible(false);
      }
    }
    this.onAuth = this.onAuth.bind(this);
    this.dis.reg('authState', this.onAuth);


    this.onStoreChange = function(){
      var info = this.store.getUserInfo();
      this.isAdminButtonVisible(info.role == 'admin');
      this.usersName(info.first + ' ' + info.last + ' (You)');
      var smallPhotoUrl = info.small_photo_url;
      if(!smallPhotoUrl){
        this.smallPhotoUrl('./assets/no-photo.jpg');
      }
      else{
        this.smallPhotoUrl(smallPhotoUrl + "?" + new Date().getTime()); // cache bust.
      }
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.sub(this.onStoreChange);




    this.onUserInfoError = function(err){
      console.log(err);
      // Not admin.
    }
    this.onUserInfoError = this.onUserInfoError.bind(this);



    this.closeMenu = function(){
      this.isMenuVisible(false);
    }
    this.closeMenu = this.closeMenu.bind(this);


    this.toggleDropDown = function(){
      if(this.isMenuVisible() === true){
        this.isMenuVisible(false);
      }
      else{
      }
      this.isMenuVisible(true);
    }
    this.toggleDropDown = this.toggleDropDown.bind(this);

    this.logOut = function(){
      this.dis.dispatch('logout');
    }





}; // end BannerViewModel constructor.


return {
    viewModel: BannerViewModel,
    template :template
};


}); // end define.
;

define('text!profile-setter/template.html',[],function () { return '\n<link rel="stylesheet" href="./styles/components/profile-setter/profile-setter.css?v=4.0"></link>\n<link rel="stylesheet" href="./styles/components/profile-setter/croppie.css?v=1.0"></link>\n\n  <div data-bind="visible:isVisible()"\n      class="background-dimmer">\n  </div>\n\n\n\n  <div class="window-holder"\n       data-bind="visible:isVisible(), complementClick: hideProfileSetter">\n\n       <div id="invalid-photo-error"\n             data-bind="visible:isFaceErrorVisible()">\n               <div>That photo kinda sucks..</div>\n               <div> How about a <i> good one </i> of you? </div>\n             <div>\n                   <button class="grey-flat-button"\n                           data-bind="click:closeErrorMessage">\n                           Okay\n                   </button>\n\n             </div>\n                  <small> (Preferably no nudes though.) </small>\n       </div>\n  <permission-error></permission-error>\n\n  <form id="profile-setter"\n        runat="server">\n\n    <!-- LEFT SIDE -->\n    <div id="profile-setter-left-side">\n\n      <div  class="profile-setter-spinner"\n            data-bind="visible:isSpinnerVisible()">\n        <div  class="screen-center-outer">\n         <div class="screen-center-inner">\n            <div class="loader"></div>\n         </div>\n       </div>\n      </div>\n\n      <div id="profile-img-holder"\n           data-bind="visible:isPhotoCropperVisible()">\n          <div id="img-uploader-preview-img">\n            <div id="no-photo-img"\n                  class="glyphicon glyphicon-camera"\n                  data-bind="visible:isLargeCameraButtonVisible(),click:webcamCapture">\n            </div>\n            <div id="missing-photo-message"\n                  data-bind="visible:isMissingPhoto()">\n                  <div>\n                      <div>upload your photo</div>\n                      <i id="missing-photo-arrow"\n                         class="glyphicon glyphicon-arrow-down">\n                       </i>\n                  </div>\n            </div>\n          </div>\n\n\n      </div>\n\n      <profile-webcam></profile-webcam>\n      <photo-controls></photo-controls>\n    </div>\n\n\n    <user-info></user-info>\n  </form>\n</div>\n';});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('profile-setter/ViewModel',['ko',
        'croppie',
        'dispatcher/Dispatcher',
        'text!profile-setter/template.html',
        'jquery',
         'user/profile-setter/ProfileStore'],
function(ko,
         Croppie,
         Dispatcher,
         template,
         $,
         ProfileStore){

  function ProfileSetterViewModel(params, componentInfo){

    this.store = ProfileStore.getInstance();
    this.dis = new Dispatcher();
    this.isVisible = ko.observable(false);
    this.isFaceErrorVisible = ko.observable(false);
    this.isPhotoCropperVisible = ko.observable(false);
    this.isSpinnerVisible = ko.observable(false);
    this.photoURL = ko.observable('');
    this.isMissingPhoto = ko.observable(false);
    this.isLargeCameraButtonVisible = ko.observable(false);
    this._successHideFeedbackDelay = 2000;
    this._imageData = null;


    this.getCroppieHolder = function(){
      var node =  $('#img-uploader-preview-img')[0];
      if(!node){
        throw new Error('Expected element with id = img-uploader-preview-img to exist in template.');
      }
      return node;
    }
    this.getCroppieHolder = this.getCroppieHolder.bind(this);

    this.injectStore = function(store){
      this.store = store;
    }

    this.makeBox = function(data, event){
      this.replaceElementWithInputBox(event);
    }


    this.webcamCapture = function(){
      this.dis.dispatch('hidePhotoCropper');
    }


    this.closeErrorMessage = function(vm, event){
      this.dis.dispatch('closeNoFaceError');
    }




    this.onStoreChanged = function(){
      var state = this.store.getCurrentState();
      let userInfo = this.store.getUserInfo();
      this.isPhotoCropperVisible(state.isPhotoCropperVisible());
      this.isVisible(state.isVisible());
      this.isFaceErrorVisible(state.isFaceErrorVisible());
      this.isSpinnerVisible(state.isSavingPhoto());

      if(state.isNewPhotoLoaded()){
        this.isPhotoCropperVisible(true);
        this.photoURL(this.store.getNewPhoto());
        this.refreshCroppie();
      }
      else if(state.isSavingPhoto()){
        this.saveCroppedPhoto();
        this.isSpinnerVisible(true);
      }
      else if(userInfo && userInfo.large_photo_url){
          userInfo.large_photo_url += '?' + (new Date()).getTime();
          this.photoURL(userInfo.large_photo_url);
          this.refreshCroppie();
          this.isLargeCameraButtonVisible(false);
      }
      else{
        this.isMissingPhoto(true);
      }
    }
    this.onStoreChanged = this.onStoreChanged.bind(this);
    this.store.sub(this.onStoreChanged);



    /**
        This should ONLY be called when the profle setter is actually
        visible.  Otherwise the scaling will be all messed up.
    */
    this.refreshCroppie = function(){
      var url = this.photoURL();
      if(this.croppie){
        this.croppie.destroy();
      }
      try{
        if(url && typeof url == 'string'){
          var options = {
                viewport: {
                    width: 450,
                    height: 450
                },
                boundary: {
                  width: '100%',
                  height: '100%'
                },
                showZoomer:false
            }
          var profilePhotoDomNode = this.getCroppieHolder();
          this.croppie = new Croppie(profilePhotoDomNode, options);
          this.bindNewPhoto(url);
        }
      }
      catch(err){
        // source image is probably missing.
        console.log(err);
      }

    }

    this.bindNewPhoto = function(url){
      var topLeftX = 0;
      var topLeftY = 0;
      var bottomRightX = 0;
      var bottomRightY = 0;
      var options = {
        url:url,
        points: [topLeftX, topLeftY, bottomRightX, bottomRightY]
      }

      var promise = this.croppie.bind(options);
      promise.then(this.setPhotoZoomToZero);
    }

    this.setPhotoZoomToZero = function(){
      this.croppie.setZoom(0);
    }
    this.setPhotoZoomToZero = this.setPhotoZoomToZero.bind(this);


    this.saveCroppedPhoto = function(){
      if(this.photoURL()){
        var self = this;
        if(this.croppie){
          this.croppie.result({type:'base64',size:'viewport'})
              .then(function(croppedImg){
                  self.dis.dispatch('saveCroppedPhoto',croppedImg);
              })
              .catch(function(err){
                console.log(err);
              });
        }
        else{
          throw new Error('Croppie has not been initialized.');
        }
      }
      else{
        throw new Error('photoUrl observable has not been set!');
      }
    }
    this.saveCroppedPhoto = this.saveCroppedPhoto.bind(this);

    this.hideProfileSetter = function(){
      this.dis.dispatch('hideProfileSetter');
    }
    this.hideProfileSetter = this.hideProfileSetter.bind(this);




}; // end ProfileSetterViewModel constructor.

return {
    viewModel: ProfileSetterViewModel,
    template :template
};


}); // end define.
;

define('text!user-info/template.html',[],function () { return '<div id="profile-setter-info-holder">\n  <div class="student-subject"\n       id="profile-setter-name"\n       data-bind="text:fullName()">\n  </div>\n  <div class="student-subject" id=\'year-and-major\'>\n    <span id="year"\n          data-bind="click:showYearOfStudyInput,\n                     visible:isYearOfStudyTextVisible(),\n                     text:yearOfStudy()">\n          1st\n    </span>\n    <input type=\'number\'\n           value=1\n           min=1\n           max=4\n           class=\'year-of-study\'\n           placeholder=\'Year\'\n           data-bind="visible:isYearOfStudyInputVisible(),\n                      hasFocus: isYearOfStudyInputFocused,\n                      value: yearOfStudyInput"/>\n    <span data-bind="click:showYearOfStudyInput">year,</span>\n\n    <span id="major-holder">\n        <span data-bind="visible:isMajorTextVisible(), click: showMajorInput, text:majorText">\n          Student\n        </span>\n        <input type=\'text\'\n               class=\'major\'\n               placeholder=\'Type Your Major\'\n               data-bind="visible:isMajorInputVisible(), hasFocus: isMajorInputFocused, textInput:partialMajor"/>\n\n        <ul class="major-search-results"\n            data-bind="foreach:suggestedMajors, complementClick:clearMajorResults, visible:suggestedMajors().length > 0">\n            <li class="major-search-result"\n                data-bind="text:major_name, click:$parent.selectSuggestedMajor">\n            </li>\n        </ul>\n      </span>\n      <div class="my-attr">\n        <label for="my-gender">Gender:</label>\n        <select class="my-attr-value"\n                data-bind="value:gender">\n                  <option value="0">female</option>\n                  <option value="1">male</option>\n                  <option value="2">other</option>\n        </select>\n      </div>\n      <div class="my-attr">\n        <div  data-bind="visible:isSavingMyInfo()"\n              class="screen-center-outer">\n         <div class="screen-center-inner">\n            <div class="small-spinner">\n            </div>\n         </div>\n       </div>\n        <label for="my-age">Birthday:</label>\n        <select id="birth-month"\n                data-bind="value:birthMonth"\n                class="my-attr-value" >\n          <option value="1">Jan</option>\n          <option value="2">Feb</option>\n          <option value="3">Mar</option>\n          <option value="4">Apr</option>\n          <option value="5">May</option>\n          <option value="6">Jun</option>\n          <option value="7">Jul</option>\n          <option value="8">Aug</option>\n          <option value="9">Sep</option>\n          <option value="10">Oct</option>\n          <option value="11">Nov</option>\n          <option value="12">Dec</option>\n        </select>\n\n      <input id="birth-day"\n             data-bind="value:birthDay"\n             class="my-attr-value"\n             type="number"\n             value="15"\n             min="1"\n             max="31">\n       </input>\n\n        <input\n           id="birth-year"\n           data-bind="value:birthYear"\n           class="my-attr-value"\n           type="number"\n           value="2004"\n           min="1900"\n           max="2015">\n       </input>\n\n       <div class="my-attr">\n         <label for="my-res">\n           Residence:\n         </label>\n\n        <select  id="my-res"\n                 class="my-attr-value"\n                 data-bind="value:residence">\n          <option value="1">Bethune</option>\n          <option value="2">Calumet</option>\n          <option value="3">Commuter (off campus)</option>\n          <option value="4">Pond</option>\n          <option value="5">Stong</option>\n          <option value="6">Tatham Hall</option>\n          <option value="7">York Village (off campus)</option>\n          <option value="8">Vanier</option>\n          <option value="9">Winters</option>\n        </select>\n       </div>\n\n      </div>\n\n\n  </div>\n\n  <textarea id="profile-about-me" data-bind="textInput:aboutMe, hasFocus:saveAboutMe">\n    About me.\n  </textarea>\n  <div id="profile-save-button-holder">\n    <button\n            class="profile-photo-button"\n            data-bind="click:saveMyInfo, visible:showSaveButton()">\n            save\n    </button>\n  </div>\n\n  <!-- <div id="detailed-profile-info">\n\n    <div class="profile-info-row">\n        <span class=\'profile-info-label\'> hometown: </span>\n        <div class="profile-indented-input">\n          <input class="" type="text" placeholder="Country"></input>\n        </div>\n        <div class=\'profile-indented-input\'>\n          <input type="text" placeholder="City"></input>\n        </div>\n    </div>\n\n    <div class="profile-info-row">\n      <span class=\'profile-info-label\'> languages </span>\n      <div class=\'profile-indented-input\'>\n        <input type="text" placeholder="First Language"> </input>\n      </div>\n      <div class=\'profile-indented-input\'>\n        <input type="text" placeholder="Second Language"> </input>\n      </div>\n\n    </div>\n\n    <div class="profile-info-row">\n        <span class=\'profile-info-label\'> memberships </span>\n        <ul>\n          <li class="profile-group">MATH1300 M W 2020</li>\n          <li class="profile-group">EECS2030 L W 2020</li>\n        </ul>\n    </div>\n\n\n  </div> -->\n</div>\n';});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('user-info/Component',['ko',
        'dispatcher/Dispatcher',
        'text!user-info/template.html',
        'jquery',
         'user/profile-setter/ProfileStore'],
function(ko,
         Dispatcher,
         template,
         $,
         ProfileStore){

  function UserInfoViewModel(params, componentInfo){

    this.store = ProfileStore.getInstance();
    this.dis = new Dispatcher();
    this.fullName = ko.observable('');
    this.yearOfStudy = ko.observable('1st');
    this.yearOfStudyInput = ko.observable('1');
    this.isYearOfStudyInputVisible = ko.observable(false);
    this.isYearOfStudyTextVisible = ko.observable(true);
    this.isYearOfStudyInputFocused = ko.observable(false);


    this.majorText = ko.observable('Student');
    this.isMajorInputVisible = ko.observable(false);
    this.isMajorInputFocused = ko.observable(false);
    this.isMajorTextVisible = ko.observable(true);
    this.partialMajor = ko.observable('');
    this.suggestedMajors = ko.observableArray([]);
    this.isSavingMyInfo = ko.observable(false)

    this.gender = ko.observable('female')


    this.birthDay = ko.observable('15')
    this.birthMonth = ko.observable('4')
    this.birthYear = ko.observable('2001')

    this.residence = ko.observable('1')


    this.aboutMe = ko.observable("About me");

    this.showSaveButton = ko.observable(false);


    var self = this


    this.gender.subscribe(function(){
      self.showSaveButton(true)
    })
    this.birthDay.subscribe(function(){
      self.showSaveButton(true)
    })
    this.birthMonth.subscribe(function(){
      self.showSaveButton(true)
    })
    this.birthYear.subscribe(function(){
      self.showSaveButton(true)
    })
    this.residence.subscribe(function(){
      self.showSaveButton(true)
    })


    this.onStoreChange = function(){
      var state = this.store.getCurrentState();
      this.isSavingMyInfo(state.isSavingMyInfo())
      if(state.isSearchingMajors()){
        this.suggestedMajors(this.store.getMatchingMajors());
      }
      else{
        var info = this.store.getUserInfo();
        this.fullName(info.first + " " + info.last);
        var date = new Date(Date.parse(info.birthday));
        this.birthDay(date.getDate())
        this.birthMonth(date.getMonth() + 1)
        this.birthYear(date.getFullYear())
        this.gender(info.sex)
        this.residence(info.res)
        this.setYearOfStudyObservable(info.year_of_study);
        this.hideYearOfStudyInputField();
        this.hideMajorInput();
        this.majorText(info.major_name);
        this.aboutMe(info.about_me);
      }
      this.showSaveButton(false)
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.sub(this.onStoreChange);



    this.showYearOfStudyInput = function(){
      this.isYearOfStudyInputVisible(true);
      this.isYearOfStudyInputFocused(true);
      this.isYearOfStudyTextVisible(false);
    }

    this.hideYearOfStudyInputField = function(){
      this.isYearOfStudyInputVisible(false);
      this.isYearOfStudyTextVisible(true);
    }

    this.onYearOfStudyLostFocus = function(state){
      if(!state){
        var year = this.yearOfStudyInput();
        this.dis.dispatch('selectYear', year);
      }
    }
    this.isYearOfStudyInputFocused.subscribe(this.onYearOfStudyLostFocus, this);


    this.setYearOfStudyObservable = function(year){
      year = Number(year);
      switch (year) {
        case 1:
          this.yearOfStudy('1st');
          break;

        case 2:
          this.yearOfStudy('2nd');
          break;

        case 3:
          this.yearOfStudy('3rd');
          break;

        case 4:
          this.yearOfStudy('4th');
          break;

        default:
          throw new Error('Bad Year.');
      }
    }


    this.showMajorInput = function(){
      this.isMajorInputVisible(true);
      this.isMajorInputFocused(true);
      this.isMajorTextVisible(false);
      this.partialMajor('');
    }

    this.getMajors = function(query){
      if(query.length > 0){
        this.dis.dispatch('getStudentMajors', query);
      }
      else{
        this.suggestedMajors([]);
      }
    }
    this.partialMajor.subscribe(this.getMajors,this);



    this.selectSuggestedMajor = function(data, event){
      if(!data.major_id || isNaN(data.major_id)){
        throw new Error("major_id is expected to be an attribute of majors.");
      }
      var majorId = data.major_id;
      this.dis.dispatch('selectMajor', majorId);
      this.suggestedMajors([]);
    }
    this.selectSuggestedMajor = this.selectSuggestedMajor.bind(this);


    this.onNewMajorSet = function(major){
      var parsedMajor = JSON.parse(major);
      this.hideMajorInput();
      this.majorText(parsedMajor.major_name);
    }
    this.onNewMajorSet = this.onNewMajorSet.bind(this);

    this.hideMajorInput = function(){
      this.suggestedMajors([]);
      this.isMajorInputVisible(false);
      this.isMajorTextVisible(true);
    }


    this.clearMajorResults = function(){
      this.suggestedMajors([]);
    }
    this.clearMajorResults = this.clearMajorResults.bind(this);


    this.majorTyped = function(){

    }


    this.saveMyInfo = function(){
      var g = this.gender()
      var m = this.birthMonth()
      var d = this.birthDay()
      var y = this.birthYear()
      var r = this.residence()
      this.dis.dispatch('saveMyInfo',{g:g,d:d,m:m,y:y,r:r})
    }
    this.saveMyInfo = this.saveMyInfo.bind(this)


    this.saveAboutMe = ko.observable('');
    this.onSaveAboutMe = function(focus){
      if(!focus && this.store.getCurrentState().isVisible()){
        var text = this.aboutMe();
        this.dis.dispatch('aboutMe', text);
      }
    }
    this.saveAboutMe.subscribe(this.onSaveAboutMe,this);

}; // end UserInfoViewModel constructor.

return {
    viewModel: UserInfoViewModel,
    template :template
};


}); // end define.
;

define('text!photo-controls/template.html',[],function () { return '\n<link rel="stylesheet"\n      href="./styles/components/profile-setter/profile-control-buttons.css?v=3.0">\n</link>\n\n<div id=\'profile-photo-buttons\'  data-bind="visible:isVisible()">\n\n  <label data-bind="click:webcamCapture"\n         class="profile-photo-button glyphicon glyphicon-camera">\n    <span class="profile-photo-upload-button">camera</span>\n  </label>\n\n\n\n  <label id=\'upload-profile-photo\'\n         class=\'profile-photo-button glyphicon glyphicon-open\'\n         for=\'img-upload-btn\'>\n          <span class="profile-photo-upload-button">upload</span>\n  </label>\n  <input type=\'file\'\n         id="img-upload-btn"\n         data-bind="event:{change:uploadPhoto}"\n         accept="image/*"/>\n\n\n  <label data-bind="click:saveProfilePhoto, visible:isSaveButtonVisible()"\n          class=\'profile-photo-button\'\n          id=\'save-profile-photo\'>\n          save\n  </label>\n</div>\n';});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('photo-controls/Component',['ko',
        'dispatcher/Dispatcher',
        'text!photo-controls/template.html',
        'jquery',
         'user/profile-setter/ProfileStore'],
function(ko,
         Dispatcher,
         template,
         $,
         ProfileStore){

  function PhotoControlsViewModel(params, componentInfo){

    this.store = ProfileStore.getInstance();
    this.dis = new Dispatcher();
    this.isVisible = ko.observable(false);
    this.isSaveButtonVisible = ko.observable(false);


    this.onStoreChange = function(){
      var state = this.store.getCurrentState();
      this.isVisible(state.isPhotoCropperVisible());
      this.isSaveButtonVisible(state.isNewPhotoLoaded());
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.sub(this.onStoreChange);

    this.webcamCapture = function(){
      this.dis.dispatch('showWebcam');
    }

    this.uploadPhoto = function(data, event){
      this.readUrl(event.currentTarget);
    }
    this.uploadPhoto = this.uploadPhoto.bind(this);


    this.readUrl = function(input) {

        if (input.files && input.files[0]) {
            var file = input.files[0];
            var reader = new FileReader();
            this.inputElement = input;
            reader.onload = this.onFileLoaded;
            reader.readAsDataURL(file);
        }
    }
    this.readUrl = this.readUrl.bind(this);


    this.onFileLoaded = function(event){
      this.clearFileChooser(this.inputElement);
      var img = event.target.result;
      this.dis.dispatch('newImgUploaded', img);
    }
    this.onFileLoaded = this.onFileLoaded.bind(this);


    this.clearFileChooser = function(inputElement){
      var $el = $(inputElement);
      $el.wrap('<form>').closest('form').get(0).reset();
      $el.unwrap();
    }
    this.clearFileChooser = this.clearFileChooser.bind(this);



    this.saveProfilePhoto = function(){
      this.dis.dispatch('saveProfilePhoto');
    }
    this.saveProfilePhoto = this.saveProfilePhoto.bind(this);


}; // end PhotoControlsViewModel constructor.

return {
    viewModel: PhotoControlsViewModel,
    template :template
};


}); // end define.
;

define('text!profile-setter/view-models/webcam/template.html',[],function () { return '\n<link rel="stylesheet"\n      href="./styles/components/profile-setter/web-capture.css?v=3.1">\n</link>\n<div data-bind="visible:isVisible()" id="web-capture-holder">\n  <video id="profile-photo-player" autoplay></video>\n  <button id="take-photo-button" class="metal radial" data-bind="click:drawToCanvas"></button>\n  <canvas id="profile-photo-canvas" width=640 height=480></canvas>\n</div>\n';});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('webcam/Component',['ko',
        'dispatcher/Dispatcher',
        'text!profile-setter/view-models/webcam/template.html',
         'user/profile-setter/ProfileStore'],
function(ko,
         Dispatcher,
         template,
         ProfileStore){

  function WebcamCaptureViewModel(params, componentInfo){

    this.store = ProfileStore.getInstance();
    this.dis = new Dispatcher();
    this.isVisible = ko.observable(false);
    const player = document.getElementById('profile-photo-player');
    const canvas = document.getElementById('profile-photo-canvas');


    const constraints = {
      video: true,
    };

    this.getContext = function(){
      return canvas.getContext('2d');
    }

    this.getCanvas = function(){
      return canvas;
    }


    this.onStoreChange = function(){
      var state = this.store.getCurrentState()

      var isVisible = state.isWebcamVisible();
      if(isVisible){
        this.isVisible(true);
        this.attachVideoToVideoElement();
      }
      else{
        this.isVisible(false);
        this.stopCapture();
      }
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.sub(this.onStoreChange);



    this.drawToCanvas = function(){
      var canvas = this.getCanvas();
      this.getContext().drawImage(player, 0, 0, canvas.width, canvas.height);
      var img = canvas.toDataURL('image/jpeg', 1.0);
      this.dis.dispatch('webcamCaptured', img);
      this.stopCapture();
    }
    this.drawToCanvas = this.drawToCanvas.bind(this);


    this.stopCapture = function() {
      const stream = player.srcObject;
      if(stream){
        const tracks = stream.getTracks();
        tracks.forEach(function(track) {
          track.stop();
        });
        player.srcObject = null;
      }
    }

    this.attachVideoToVideoElement = function(callback){
      var self = this;
      var nav = this.getNavigatorReference();
      nav.mediaDevices.getUserMedia(constraints)
         .then(this.onCameraStarted)
         .catch(this.onCameraError);
    }

    this.getNavigatorReference = function(){
      return navigator;
    }

    this.onCameraStarted = function(stream){
        player.srcObject = stream;
    }
    this.onCameraStarted = this.onCameraStarted.bind(this);

    this.onCameraError = function(err){
      if(/Permission/.test(err.message)){
        this.dis.dispatch('cameraPermissionError');
      }
    }
    this.onCameraError = this.onCameraError.bind(this);


}; // end WebcamCaptureViewModel constructor.

return {
    viewModel: WebcamCaptureViewModel,
    template :template
};


}); // end define.
;

define('text!permission-error/template.html',[],function () { return '<link rel="stylesheet"\n      href="./styles/components/profile-setter/permission-error.css?v=3.0">\n</link>\n\n<div id="permission-error-holder"\n    data-bind="visible:isVisible()">\n      <div>  We need your permission </div>\n      <div>  to turn on the camera </div>\n          <button data-bind="click:onOkay">\n            Okay I will change the settings\n          </button>\n          <button data-bind="click:onMaybeLater">\n                  Maybe later\n          </button>\n        <div>   </div>\n</div>\n';});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('permission-error/Component',['ko',
        'dispatcher/Dispatcher',
         'text!permission-error/template.html',
         'user/profile-setter/ProfileStore'],
function(ko,
         Dispatcher,
         template,
         ProfileStore){

  function PermissionErrorViewModel(params, componentInfo){
    this.store = ProfileStore.getInstance();
    this.dis = new Dispatcher();
    this.isVisible = ko.observable(false);

    this.onStoreChange = function(){
      var isVisible = this.store.getCurrentState().isPermissionErrorVisible();
      this.isVisible(isVisible);
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.sub(this.onStoreChange);


    this.onOkay = function(){
      this.dis.dispatch('acknowledgePermissionNeed');
    }

    this.onMaybeLater = function(){
      this.dis.dispatch('hideProfileSetter');
    }

}; // end PermissionErrorViewModel constructor.

return {
    viewModel: PermissionErrorViewModel,
    template :template
};


}); // end define.
;

define('people-models/Person',['ko'],
function(ko){

  var Person = function(info, host){

    this.getConstructorName = function(){
      return "Person";
    }

    this._id = -1;
    this._first = null;
    this._last = null;

    if(!host || typeof host != 'string'){
      throw new Error('server host must be passed to Person constructor.');
    }
    this._host = host;

    this._msgsSeen = ko.observable(false);
    this.present = ko.observable(false);
    this._defaultPhotoURL = "./assets/no-photo.jpg";
    this._small_photo_url = ko.observable(this._defaultPhotoURL);
    this._large_photo_url = ko.observable(this._defaultPhotoURL);
    this._year_of_study = 1;
    this._major = 'Student';
    this._isInGroup = false;



    var error = null;
    if(!info.id || isNaN(info.id)){
      error = 'A person must have an id number.';
    }
    else if(!info.first){
      error = "A person must have a first name.";
    }
    else if(!info.last){
      error = 'A Person must have a last name.';
    }
    else if(!info.role){
      error = "A person must have a role";
    }
    else if(!info.large_photo_url && info.large_photo_url != null){
      error = "A person must have a large_photo_url";
    }
    else if(!info.small_photo_url && info.small_photo_url != null){
      error = "A person must have a small_photo_url";
    }
    else if(typeof info.present !== 'boolean'){
      error = "A person must have a boolean present attribute.";
    }

    if(error != null){
      throw new Error(error);
    }


    this.setId = function(id){
      if(id > 0){
      this._id = id;
      }
      else{
        throw new Error('id must be a postive int.');
      }
    }
    this.setId(info.id);



    this.present(info.present);
    this._msgsSeen(info.msgsSeen);
    this._first = info.first;
    this._last = info.last;
    this._role = info.role;
    this._isInGroup = info.isInGroup;

    this.setLastSeen = function(lastSeen){
      this._lastLogin = lastSeen;
    }
    this.setLastSeen(info.last_login);


    this.getLastSeen = function(){
      return this._lastLogin;
    }

    if(info.year_of_study){
      this._year_of_study = info.year_of_study;
    }
    if(info.major){
      this._major = info.major;
    }

    this.setId = function(id){
      if(isNaN(id) || id <= 0){
        throw new Error('Person id must be a postive number.');
      }
      this._id = id;
    }

    this.getId = function(){
      return this._id;
    }

    this.setClassesInCommonCount = function(count){

      if(count < 0){
        throw new Error('count must be 0 or more.');
      }
      this._numberOfSharedClasses = count;

    }
    this.setClassesInCommonCount(info.shared_classes);


    this.getSharedClassCount = function(){
      return this._numberOfSharedClasses;
    }

    this.getHost = function(){
      return this._host;
    }

    this.setHost = function(host){
      this._host = host
    }

   this.getLastLogin = function(){
     return this._lastLogin;
   }

    this.setDefaultPhotoURL = function(){
      this._small_photo_url(this._defaultPhotoURL);
      this._large_photo_url(this._defaultPhotoURL);
    }


    this.getDefaultPhotoURL = function(){
      return this._defaultPhotoURL;
    }

    this.getLargePhotoURL = function(){
      return this._large_photo_url();
    }

    this.getRelativeLargePhotoURL = function(){
      return this._relative_large_photo_url
    }

    this.setLargePhotoURL = function(url){
      if(url && typeof url == 'string'){
        this._large_photo_url(this._host + '/' + url);
        this._relative_large_photo_url = url
      }
      else{
        var defaultURL = this._defaultPhotoURL;
        this._large_photo_url(defaultURL);
        this._relative_large_photo_url = defaultURL;
      }
    }
    this.setLargePhotoURL(info.large_photo_url);


    this.setSmallPhotoURL = function(url){
      if(typeof url != 'string' || url.length < 1){
        throw new Error('small_photo_url must be a postive length string.');
      }
      else{
        this._small_photo_url(this._host + '/' + url);
        this._relative_small_photo_url = url
      }
    }


    if(info.small_photo_url != null){
      this.setSmallPhotoURL(info.small_photo_url);
    }

    this.getSmallPhotoURL = function(){
      return this._small_photo_url();
    }

    this.getRelativeSmallPhotoURL = function(){
      return this._relative_small_photo_url
    }


    this.setMajor = function(major){
      if(!major){
        this._major = 'Student';
      }else{
        this._major = major;
      }
    }


    this.setYearOfStudy = function(year){
      if(!year){
        this._year_of_study = 1;
      }
      else{
        this._year_of_study = year;
      }
    }

    this.formatSchoolYear = function(year){
      switch (year) {
        case 1:
          return '1st Year, ';

        case 2:
          return '2nd Year, ';

        case 3:
          return '3rd Year, ';

        case 4:
          return '4th Year, ';

        default:
        return '1st Year, ';
      }
    }

    this.getEducationLevel = function(){
      return this.formatSchoolYear(this._year_of_study) + this._major;
    }


    this.getFirst = function(){
      return this._first;
    }

    this.getLast = function(){
      return this._last;
    }

    this.getRole = function(){
      return this._role;
    }

    this.setRole = function(role){
      this._role = role;
    }

    this.isPresent = function(){
      return this.present();
    }

    this.setPresent = function(){
      this.present(true);
    }

    this.setAbsent = function(){
      this.present(false);
    }

    this.setMsgsSeen = function(){
      this._msgsSeen(true);
    }

    this.setMsgsUnseen = function(){
      this._msgsSeen(false);
    }

    this.hasAllMsgsSeen = function(){
      return this._msgsSeen();
    }

    this.setLastMessageReceived = function(message){
      this._lastMessageReceived = message;
    }
    this.setLastMessageReceived(info.unseen_message);


    this.getLastMessageReceived = function(){
      return this._lastMessageReceived;
    }

    this.isInGroup = function(){
      return this._isInGroup;
    }

    this.setAsInGroup = function(){
      this._isInGroup = true;
    }

    this.setAsOutGroup = function(){
      this._isInGroup = false;
    }

    this.getClassName = function(){
      return "Person";
    }

    this.compareTo = function(other){
      if(!other || typeof other != 'object' || !other.getClassName || other.getClassName() != "Person"){
        throw new Error("Can only compare people with people.");
      }

      var c0 = this.compareByMereExposure(other);
      var c1 = this.compareByMsgsSeen(other);
      var c2 = this.compareByPresence(other);

      if(c0 != 0) return c0; //
      if(c1 != 0) return c1;
      if(c2 != 0) return c2;
    } // end compareTo.


    this.compareByMereExposure = function(other){
      var thisCount = this.getSharedClassCount();
      var otherCount = other.getSharedClassCount();
      if(thisCount > otherCount){
        return -1;
      }
      else if(thisCount == otherCount){
        return 0;
      }
      else{
        return 1;
      }
    }


    this.compareByMsgsSeen = function(other){
      var thisAllSeen = this.hasAllMsgsSeen();
      var otherAllSeen = other.hasAllMsgsSeen();
      if(thisAllSeen == false && otherAllSeen){
        return -1;
      }
      else if(thisAllSeen && otherAllSeen == false){
        return 1;
      }
      else{
        return 0;
      }
    }

    this.compareByPresence = function(other){
      var thisPresent = this.isPresent();
      var otherPresent = other.isPresent();
      if(thisPresent && otherPresent == false){
        return -1;
      }
      else if(thisPresent == false && otherPresent){
        return 1;
      }
      else{
        return 0;
      }
    }


    this.isAddable = function(){
      return false;
    }
    this.isAddable = this.isAddable.bind(this);

    this.isReal = function(){
      return true
    }

    this.getRaw = function(){
      var raw = {
          id:this.getId(),
          first:this.getFirst(),
          last:this.getLast(),
          small_photo_url:this.getRelativeSmallPhotoURL(),
          large_photo_url:this.getRelativeLargePhotoURL(),
          role:this.getRole(),
          present:this.isPresent(),
      }
      console.log(raw)
      return raw
    }
  }

  // factory method.


  Person.getRaw = function(){
    return {
        id:2,
        first:'First',
        last:'Last',
        small_photo_url:'profile_images/485s.jpg',
        large_photo_url:'profile_images/485l.jpg',
        isInGroup:true,
        role:'Student',
        present:true,
        msgsSeen:true
    }
  }


  Person.getFake = function(){
    var raw = Person.getRaw();
    return new Person(raw,'https://www.profile.palolo.ca/');
  }



    Person.getCopy = function(p){
      return new Person({
        id:p._id,
        first:p._first,
        last:p._last,
        role:p._role,
        present:false
      }, p._host);
    }


  return Person;
})
;
define('people-models/Pal',['ko','people-models/Person'],
function(ko,Person){

  var Pal = function(data, host){
    Object.setPrototypeOf(this, new Person(data, host));
    this.constructor = Pal;
    this.isNew = ko.observable(false);
    this.is_new = 0;

    this.setIsNew = function(isNew){
      if(isNew != 0 && isNew != 1){
        throw new Error('is_new must be 0 or 1.');
      }
      if(isNew == 1){
        this.isNew(true);
        this.is_new = 1;
      }
      else{
        this.isNew(false);
        this.is_new = 0;
      }
    }
    this.setIsNew(data.is_new);


    this.getRawNew = function(){
      return this.is_new;
    }


    this.setAsNew = function(){
      this.isNew(true);
      this.is_new = 1;
    }

    this.setAsOld = function(){
      this.isNew(false);
    }

    this.isAddable = function(){
      return false
    }
  }

  Pal.getRaw = function(){
      var raw = Person.getRaw();
      raw.is_new = 0;
      return raw;
    }

  Pal.getFake = function(){
    var raw = Person.getRaw();
    raw.is_new = 0;
    return new Pal(raw,Person.getFake()._host);
  }


  return Pal;

});

define('people-models/Classmate',['ko','people-models/Person'],
function(ko,Person){

  var Classmate = function(data, host){
    Object.setPrototypeOf(this, new Person(data, host));

    this.setScore = function(score){
      if(score < 0.0 || score > 1.0){
        throw new Error('score must be between 0 and 1')
      }
      this.score = score;
    }
    this.setScore(data.score)

    this.getScore = function(){
      return this.score
    }

    this.isAddable = function(){
      return true;
    }

  }

  Classmate.getRaw = function(){
    return Person.getRaw();
  }

  Classmate.getFake = function(){
    var raw = Person.getRaw();
    raw.score = 1.0
    raw.is_pending_acceptance = false;
    var host = Person.getFake().getHost();
    return new Classmate(raw, host);
  }

  return Classmate;

});


define('people-store/PeopleRemoteService',['socketio',
        'ActiveRemoteService',
        'dispatcher/Dispatcher',
        'people-models/Person',
        'people-models/Pal',
        'people-models/Classmate'],
function(io,
         ActiveRemoteService,
         Dispatcher,
         Person,
         Pal,
         Classmate){

  var instance = null;

  var PeopleRemoteService = function(){

    Object.setPrototypeOf(this,new ActiveRemoteService());
    this.setMicroServer("friends");
    this.constructor = PeopleRemoteService;
    this.dis = new Dispatcher();
    this.PAL_REFRESH_RATE = 5000;

    this.getConstructorName = function(){
      return 'PeopleRemoteService';
    }

    this.init = function(){
      this.setSock(this.onSock);
    }
    this.init = this.init.bind(this);


    this.onSock = function(){
      this.sock.on('connect',this.getPalList);
      this.sock.on('connect',this.getPalRequestList);
      this.sock.on('palList', this.onPalList);
      this.sock.on('palRequestSent',this.onPalRequestSent);
      this.sock.on('palRequestReceived',this.onPalRequestRecieved);
      this.sock.on('palRequestList',this.onPalRequestList);
      this.sock.on('palRequestAccepted', this.onPalRequestAccepted);
      this.sock.on('classList', this.onClassList);
      this.sock.on('io_error',this.onError);
    }
    this.onSock = this.onSock.bind(this);


    this.onAuth = function(auth){
      if(auth && auth.state == 'authenticated'){
        this.init();
      }
    }
    this.onAuth = this.onAuth.bind(this);
    this.dis.reg('authState', this.onAuth);


    this.onError = function(err){
      console.log('Something went wrong on the relationship server.');
      alert(err);
    }
    this.onError = this.onError.bind(this);




    this.getPalList = function(){
      this.sock.emit('getPalList');
      var self = this;
      self.timerId = setTimeout(function(){
        self.getPalList();
      },self.PAL_REFRESH_RATE);
    }
    this.getPalList = this.getPalList.bind(this);



    this.onPalList = function(pals){
      var col = [];
      var url = this.getServerURL();
      pals.forEach(function(pal){
        col.push(new Pal(pal, url));
      })
      this.dis.dispatch('palList',col)
    }
    this.onPalList = this.onPalList.bind(this);


    this.onGroupInfo = function(g){
      this.init();
      this.sock.emit('getClassList',g.getId());
      var self = this;
      if(typeof this.getClassTimerId == 'number'){
        clearTimeout(this.getClassTimerId);
      }
      this.getClassTimerId = setTimeout(function(){
        self.onGroupInfo(g);
      },self.PAL_REFRESH_RATE);
    }
    this.onGroupInfo = this.onGroupInfo.bind(this);
    this.onGroupInfoId = this.dis.reg('groupInfo', this.onGroupInfo);


    this.onClassList = function(classmates){
      var col = [];
      var url = this.getServerURL();
      classmates.forEach(function(classmate){
        col.push(new Classmate(classmate, url));
      })
      this.dis.dispatch('classList',col)
    }
    this.onClassList = this.onClassList.bind(this);


    this.onFocusPerson = function(p){
      if(Number.isInteger(p._id) == false){
        console.log(p)
        throw new Error('Something is fucked');
      }

      this.sock.emit('focusPerson',p);
    }
    this.onFocusPerson = this.onFocusPerson.bind(this);
    this.focusPersonId = this.dis.reg('focusPerson',this.onFocusPerson);


    /**
      p is an instance of Person (not a subclass)
    */
    this.onAddPal = function(p){
      var person = Object.getPrototypeOf(p)
      this.sock.emit('addPal', person);
    }
    this.onAddPal = this.onAddPal.bind(this);
    this.addPalId = this.dis.reg('addPal',this.onAddPal);


    this.onPalRequestSent = function(p){
      var pal = Person.getCopy(p);
      this.dis.dispatch('palRequestSent',pal);
    }
    this.onPalRequestSent = this.onPalRequestSent.bind(this);

    this.onPalRequestRecieved = function(p){
      var pal = new Person(p,this.getServerURL());
      this.dis.dispatch('palRequestReceived',pal);
    }
    this.onPalRequestRecieved = this.onPalRequestRecieved.bind(this);


    this.acceptRequest = function(p){
      this.sock.emit('acceptPalRequest',p);
    }
    this.acceptRequest = this.acceptRequest.bind(this);
    this.acceptRequestId = this.dis.reg('acceptRequest',this.acceptRequest);


    this.onPalRequestAccepted = function(p){
      var host = this.getServerURL();
      var pal = new Pal(p,host);
      pal.setAsNew();
      this.dis.dispatch('palRequestAccepted',pal);
    }
    this.onPalRequestAccepted = this.onPalRequestAccepted.bind(this);



    this.getPalRequestList = function(){
      this.sock.emit('getPalRequestList');
      var self = this;
      self.palRequestTimerId = setTimeout(function(){
        self.getPalRequestList();
      }, self.PAL_REFRESH_RATE);
    }
    this.getPalRequestList = this.getPalRequestList.bind(this);


    this.onPalRequestList = function(requests){
      var people = [];
      var url = this.getServerURL();
      requests.forEach(function(person){
        var p = new Person(person,url);
        people.push(p);
      })
      this.dis.dispatch('palRequestList',people);
    }
    this.onPalRequestList = this.onPalRequestList.bind(this);

    this.onDenyRequest = function(p){
      this.sock.emit('denyRequest',p);
    }
    this.onDenyRequest = this.onDenyRequest.bind(this);
    this.denyRequestId = this.dis.reg('denyRequest',this.onDenyRequest)

  }
  return {
    getInstance:function(){
      if(!instance){
        instance = new PeopleRemoteService();
      }
      return instance;
    },
    getNew:function(){
      return new PeopleRemoteService();
    }
  };
})
;

define('people-models/NullPerson',['people-models/Person','ko'],
function(Person, ko){

  var NullPerson = function(info){
    var defaultPerson = Person.getFake();
    Object.setPrototypeOf(this, defaultPerson);
    this.constructor = NullPerson;
    this.getConstructorName = function(){
      return "NullPerson";
    }
    this.getId = function(){
      return -1;
    }

    this.isNew = function(){
      return false;
    }

    this.isReal = function(){
      return false
    }
  }
  return NullPerson;
})
;
define('people-models/PendingPal',['people-models/Person'],
function(Person){

  var PendingPal = function(person){
    var host = person.getHost()
    var data = person.getRaw()
    Object.setPrototypeOf(this, new Person(data, host));
    this.constructor = PendingPal;
    this.setHost(host)

    this.isAddable = function(){
      return false
    }
  }
  return PendingPal;

});

define('people-store/PeopleStore',['dispatcher/Dispatcher',
        'abstract-interfaces/Store',
        'people-store/PeopleRemoteService',
        'people-models/Pal',
        'people-models/NullPerson',
        'people-models/PendingPal'],
function(Dispatcher,
        Store,
        PeopleRemoteService,
        Pal,
        NullPerson,
        PendingPal){

   var instance = null;

   var PeopleStore  = function(){

     Object.setPrototypeOf(this, new Store());
     this.dis = new Dispatcher();
     this.remote = PeopleRemoteService.getInstance();
     this.palList = [];
     this.palRequests = [];
     this.classList = [];
     this.classListVisible = false;
     this.focusedPerson = new NullPerson();
     this.isPalRequestSentVisible = false;
     this.lastPalRequested = null;



     this.getDis = function(){
       return this.dis;
     }

     this.getPalList = function(){
       return this.palList;
     }

     this.getClassList = function(){
       return this.classList;
     }

     this.getPalRequests = function(){
       return this.palRequests;
     }

     this.onPalList = function(list){
       this.palList = list;
       this.pub();
     }
     this.onPalList = this.onPalList.bind(this);
     this.onPalsId = this.dis.reg('palList',this.onPalList);

     this.onClassList = function(list){
       this.classList = list;
       this.pub();
     }
     this.onClassList = this.onClassList.bind(this);
     this.onClassListId = this.dis.reg('classList', this.onClassList);

     this.isClassListVisible = function(){
       return this.classListVisible;
     }
     this.isClassListVisible = this.isClassListVisible.bind(this);

     this.focusPerson = function(p){
       this.focusedPerson = p;
       this.onAcknowledgeNewPal(p);
       this.pub();
     }
     this.focusPerson = this.focusPerson.bind(this);
     this.focusPersonId = this.dis.reg('focusPerson', this.focusPerson);



     this.onAcknowledgeNewPal = function(p){
       if(p.constructor.name == 'Pal'){
         this.palList.forEach(function(pal){
           if(pal.getId() == p.getId()){
             pal.setAsOld();
             pal.setMsgsSeen();
             return;
           }
         })
       }
     }
     this.onAcknowledgeNewPal = this.onAcknowledgeNewPal.bind(this);


     this.getFocusedPerson = function(){
       return this.focusedPerson;
     }

     this.onShowClassList = function(){
       this.classListVisible = true;
       this.pub();
     }
     this.onShowClassList = this.onShowClassList.bind(this);
     this.showClassListId = this.dis.reg('showClassList',this.onShowClassList);

     this.onHideClassList = function(){
       this.classListVisible = false;
       this.pub();
     }
     this.onHideClassList = this.onHideClassList.bind(this);
    this.hideClassListId = this.dis.reg('hideClassList',this.onHideClassList);


    this.onGrpInfo = function(grp){
      if(grp.getId() != this.currentGrpId){
        this.focusedPerson = new NullPerson();
        this.pub();
      }
    }
    this.onGrpInfo = this.onGrpInfo.bind(this);
    this.onGrpInfoId = this.dis.reg('groupInfo',this.onGrpInfo);

    this.onShowGroupView = function(){
      this.focusedPerson = new NullPerson();
      this.pub();
    }
    this.onShowGroupView = this.onShowGroupView.bind(this);
    this.showGroupId = this.dis.reg('showGroupView', this.onShowGroupView);


    this.isPalRequestSent = function(){
      return this.isPalRequestSentVisible;
    }
    this.isPalRequestSent = this.isPalRequestSent.bind(this);

    this.lastPalRequestPal = function(){
      return this.lastPalRequested;
    }
    this.lastPalRequestPal = this.lastPalRequestPal.bind(this);

    this.onPalRequestSent = function(pal){
      this.lastPalRequested = pal;
      this.isPalRequestSentVisible = true;
      this.removeFromClassList(pal);
      if(this.focusedPerson.getId() == pal.getId()){
        this.focusedPerson = new PendingPal(this.focusedPerson)
      }
      this.pub();
      var self = this;
      this.timerId = setTimeout(function(){
        self.isPalRequestSentVisible = false;
        self.pub();
      },3000);
    }
    this.onPalRequestSent = this.onPalRequestSent.bind(this);
    this.palRequestSentId = this.dis.reg('palRequestSent',this.onPalRequestSent);

    this.removeFromClassList = function(c){
      var i = 0;
      this.classList.forEach(function(classmate){
        if(c._id == classmate.getId()){
          return;
        }
        i++;
      })
      this.classList.splice(i,1);
    }
    this.removeFromClassList = this.removeFromClassList.bind(this);


    this.onPalRequestReceived = function(p){
      this.palRequests.push(p);
      this.pub();
    }
    this.onPalRequestReceived = this.onPalRequestReceived.bind(this);
    this.palRequestReceivedId = this.dis.reg('palRequestReceived', this.onPalRequestReceived);


    this.onPalRequestAccepted = function(p){
      this.palList.push(p);
      this.pub();
    }
    this.onPalRequestAccepted = this.onPalRequestAccepted.bind(this);
    this.onRequestAcceptedId = this.dis.reg('palRequestAccepted', this.onPalRequestAccepted);

    this.getPalRequestList = function(){
      return this.palRequests;
    }

    this.addPal = function(p){
      if(p instanceof Pal)
        this.palList.push(p);
    }
    this.addPal = this.addPal;

    this.onPalRequestList = function(palRequests){
      this.palRequests = palRequests;
      this.pub();
    }
    this.onPalRequestList = this.onPalRequestList.bind(this);
    this.dis.reg('palRequestList', this.onPalRequestList);

    this.onAcceptRequest = function(p){
      var index = this.findPalRequest(p);
      if(index >= 0){
        var removedPerson = this.palRequests.splice(index,1);
        this.palList.push(removedPerson);
        this.pub();
      }
    }
    this.onAcceptRequest = this.onAcceptRequest.bind(this);
    this.acceptRequestId = this.dis.reg('acceptRequest',this.onAcceptRequest);


    /**
      removes person p from the palRequests list
      (if they are in the list.)
    */
    this.onDenyRequest = function(p){
      var index = this.findPalRequest(p)
      if(index >= 0){
        this.palRequests.splice(index, 1)
        this.pub()
      }
    }
    this.onDenyRequest = this.onDenyRequest.bind(this);
    this.denyRequestId = this.dis.reg('denyRequest',this.onDenyRequest)


    this.findPalRequest = function(p){
      var r = this.palRequests
      var index = -1
      for(var i = 0; i < r.length; i++){
        if(r[i].getId() == p.getId()){
          index = i
          break
        }
      }
      return index;
    }
    this.findPalRequest = this.findPalRequest.bind(this);




  } // end





   // this.onCourseGroupInfoCallbackId = this.dis.reg('groupInfo', this.onCourseGroupInfo);



    return {
      getInstance:function(){
        if(!instance){
          instance = new PeopleStore();
        }
        return instance;
      },
      getNew:function(){
        return new PeopleStore();
      }
    }
  })
;

define('text!notification/template.html',[],function () { return '\n<link rel="stylesheet"\n      href="./styles/components/notification/style.css?v=1.0"></link>\n\n  <div id="notification-holder" data-bind="visible:isVisible()">\n\n    <span class="glyphicon glyphicon-bell"\n          data-bind="click:openNotifications">\n\n      <span id="notification-bell-count"\n            class="notification-number-background"\n            data-bind="visible:computeUnseenCount() > 0">\n            <span  class="notification-number"\n                    data-bind="text:computeUnseenCount()">\n            </span>\n      </span>\n    </span>\n\n\n    <span data-bind="visible:isNotifcationsOpen()">\n      <span class="arrow-up notifications-arrow-up"></span>\n\n      <ul id="notification-list"\n          data-bind="foreach:notifications,\n                     complementClick: closeNotifications">\n\n            <li class="notification-row"\n                data-bind="css:{\'notification-seen\':getHasBeenSeen()}, click:$parent.onNotificationClicked">\n              <img  class="notification-profile-image"\n                    data-toggle="tooltip"\n                    data-bind="attr:{ src : getPhotoURL(), title : getFirstName() + \' \' + getLastName() }">\n              </img>\n              <span class="notification-content-holder">\n                <div class=\'notification-content\'\n                      data-bind="text:messageSnippet()">\n                </div>\n                <div class="notification-date">\n                    <span>Sent </span>\n                    <span data-bind="text:getMessageTimestamp()"></span>\n                    <span data-bind="visible:getConstructorName() === \'ForumNotification\'">\n                      <!-- <span data-bind="text:getForumName()"></span> -->\n                    </span>\n                </div>\n\n              </span>\n            </li>\n      </ul>\n\n\n    </span>\n\n  </div>\n';});

define('notification/models/Notification',['ko','people-models/Person'],
function(ko, Person){

  function Notification(raw, host){

    this._hasBeenSeen = ko.observable(false);
    this.messageSnippet = ko.observable('');
    this.person = new Person(raw, host);


    this.getPerson = function(){
      return this.person;
    }

    this.getFirstName = function(){
      return this.person.getFirst();
    }

    this.getLastName = function(){
      return this.person.getLast();
    }

    this.getPhotoURL = function(){
      var url = this.person.getSmallPhotoURL() + "?=" + Date.now();
      return url;
    }
    this.getPhotoURL = this.getPhotoURL.bind(this);

    this._isValidString = function(attr){
      if(!attr || typeof attr != 'string' || attr.length < 1){
        throw new Error('attribute must be a non-empty string.');
      }
    }

    this.getMessageId = function(){
      return this.id;
    }


    this.setMessageId = function(id){
      if(!id || Number.isInteger(id) == false || id < 1){
        throw new Error('message_id must be a positive integer.');
      }
      this.id = id;
    }
    this.setMessageId(raw.message_id);



    this.setHost = function(host){
      this._isValidString(host);
      this._host = host;
    }
    this.setHost(host);

    this.getHost = function(){
      return this._host;
    }


    this.setMessageSnippet = function(snippet){
      this._isValidString(snippet);
      this.messageSnippet(snippet);
    }
    this.setMessageSnippet = this.setMessageSnippet.bind(this);
    this.setMessageSnippet(raw.text);


    this.setMessageTimetamp = function(timestamp){
      this._isValidString(timestamp);
      this._timestamp = timestamp;
    }
    this.setMessageTimetamp(raw.timestamp);


    this.getMessageTimestamp = function(){
      return this._timestamp;
    }

    this.setHasBeenSeen = function(){
      this._hasBeenSeen(true);
    }

    this.setSeenTo = function(bool){
      if(typeof bool != 'number' || (bool != 0 && bool != 1)){
        throw new Error('seen must be 0 or 1.');
      }
      if(bool == 1){
        this._hasBeenSeen(true);
      }
      else{
        this._hasBeenSeen(false);
      }
    }
    this.setSeenTo(raw.seen);




    this.getHasBeenSeen = function(){
      return this._hasBeenSeen();
    }





}; // end consturctor


return Notification;

}); // end define.
;

define('notification/NotificationRemoteService',['ActiveRemoteService',
        'socketio',
        'dispatcher/Dispatcher',
        'notification/models/Notification'],
function(ActiveRemoteService,
         io,
         Dispatcher,
         Notification){

  var NotificationRemoteService = function(){
      Object.setPrototypeOf(this,new ActiveRemoteService());
      this.setMicroServer("notifications");
      this._io = io;
      this.dis = new Dispatcher();


      this.initialize = function(){
        this.setSock();
      }


      this.connect = function(){
        if(this.sock){
            this.sock.connect();
        }
      }

      this.registerOnNotificationsUpdate = function(callback){
        this._checkType(callback);
        this.sock.on('notifications', callback);
      }


      this.setChatMsgNotifSeen = function(notif){
        if(notif instanceof Notification == false){
          throw new Error('notif must be a Notification.');
        }

        this.sock.emit('chatNotifSeen',{senderId:notif.getPerson().getId()});
      }


      this._checkType = function(cb){
        if(typeof cb != 'function'){
          throw new Error('callback needs to be a function.');
        }
      }
  }

  return NotificationRemoteService;
})
;
define('notification/models/ViewedChatNotification',['ko',
        'notification/models/Notification',
        'people-models/Person'],
function(ko,
        Notification,
        Person){

  function ViewedChatNotification(rawNotification, host){

    Object.setPrototypeOf(this, new Notification(rawNotification, host));

    this._hasBeenSeen = ko.observable(true);

    this.getConstructorName = function(){
      return 'ViewedChatNotification';
    }


    this._isValidString = function(attr){
      if(!attr || typeof attr != 'string' || attr.length < 1){
        throw new Error('attribute must be a non-empty string.');
      }
    }




}; // end constructor.


  ViewedChatNotification.getFake =  function(senderId){
      var raw = ViewedChatNotification.getRaw();
      return new ViewedChatNotification(raw, 'http://host.com');
    }


  ViewedChatNotification.getRaw  = function(){
    var o1 = {
     message_id:100,
     text: "message snippet.",
     timestamp: "Dec 12 2019",
     seen:1,
     type:'seen-chat'
   }
   var o2 = Person.getRaw();
   return Object.assign(o1,o2);
  }


  return ViewedChatNotification;


}); // end define.
;
define('notification/models/UnseenChatNotification',['ko',
        'notification/models/Notification',
        'people-models/Person'],
function(ko,
        Notification,
        Person){

  function UnseenChatNotification(raw, host){

    Object.setPrototypeOf(this, new Notification(raw, host));

    this.getConstructorName = function(){
      return 'UnseenChatNotification';
    }
};


    UnseenChatNotification.getFake = function(){
      var raw = UnseenChatNotification.getRaw();
      return new UnseenChatNotification(raw, 'https://host');
    }

    UnseenChatNotification.getRaw = function(){
      var o1 = {
        message_id:1,
        text: "message snippet.",
        timestamp: "Dec 12 2019",
        seen:0,
        type:'chat'
      }
      var o2 = Person.getRaw();
      return Object.assign(o1,o2);
    }



  return UnseenChatNotification;


}); // end define.
;
define('notification/models/ForumNotification',['ko',
        'notification/models/Notification',
        'people-models/Person'],
function(ko,
         Notification,
        Person){

  var ForumNotification = function(raw, host){

    Object.setPrototypeOf(this, new Notification(raw, host));

    this.getConstructorName = function(){
      return 'ForumNotification';
    }

    this.getForumName = function(){
      return this.forumName;
    }

    this.setForumName = function(forum){
      this._isValidString(forum,'forum_name must be a attribute.');
      this.forumName = forum;
    }
    // this.setForumName(raw.forum_name);


    this.getGroupId = function(){
      return this.grpId;
    }

    this.setGroupId = function(id){
      if(id && Number.isInteger(id) && id > 0){
        this.grpId = id;
      }
      else{
        throw new Error('group_id must be a positive integer.');
      }
    }
    this.setGroupId(raw.group_id);


  };


    ForumNotification.getFake = function(){
      var raw = ForumNotification.getRaw();
      return new ForumNotification(raw, 'https://host');
    }

    ForumNotification.getRaw = function(){
      var o1 = {
        message_id:2,
        group_id:55,
        text: "message snippet.",
        timestamp: "Dec 12 2019",
        forum_name:"MATH1300 M",
        seen:0,
        type:'forum'
      }
      var o2 = Person.getRaw();
      return Object.assign(o1,o2);
    }



  return ForumNotification;


}); // end define.
;
define('notification/Component',['ko',
        'dispatcher/Dispatcher',
        'text!notification/template.html',
        'notification/NotificationRemoteService',
        'notification/models/ViewedChatNotification',
        'notification/models/UnseenChatNotification',
        'notification/models/ForumNotification',
        'jquery'],
function(ko,
         Dispatcher,
         template,
         NotificationRemoteService,
         ViewedChatNotification,
         UnseenChatNotification,
         ForumNotification,
         $){

  function NotificationViewModel(params, componentInfo){

  this._remoteService = new NotificationRemoteService();
  this.dis = new Dispatcher();
  this.isVisible = ko.observable(false);
  this.notifications = ko.observableArray([]);
  this.isNotifcationsOpen = ko.observable(false);


  this.onAuth = function(auth){
    if(auth.state == 'authenticated'){
      this._remoteService.initialize();
      this._remoteService.registerOnNotificationsUpdate(this.onNotifications);
      this._remoteService.connect();
    }
  }
  this.onAuth = this.onAuth.bind(this);
  this.dis.reg('authState', this.onAuth);


  this.onNotificationClicked = function(notification){
      notification.setHasBeenSeen();
      if(notification.getConstructorName() == 'ForumNotification'){
        this.dis.dispatch('selectedGroupId', notification.getGroupId());
      }
      else{
        var p = notification.getPerson();
        console.log(p);
        console.log(p);
        this.dis.dispatch('focusPerson', p);
        this._remoteService.setChatMsgNotifSeen(notification);
      }
    this.closeNotifications();
  }
  this.onNotificationClicked = this.onNotificationClicked.bind(this);

  this.oldUnseenCount = 0;
  this.computeUnseenCount = function(){
    var unseenCount = 0;
    for(var i = 0; i < this.notifications().length; i++){
      var notif = this.notifications()[i];
      if(notif.getHasBeenSeen() == false){
        unseenCount++;
      }
      if(unseenCount > this.oldUnseenCount && unseenCount > 0){
        this.ding();
      }
    }
    this.oldUnseenCount = unseenCount;
    return unseenCount;
  }
  this.computeUnseenCount = this.computeUnseenCount.bind(this);
  this.unseenCount = ko.computed(this.computeUnseenCount);


  this.dingDone = true;
  this.ding = function(callback){
    var self = this;
    if(self.dingDone){
      var audio = new Audio('./assets/audio/play-ding.mp3');
      self.dingDone = false;
      audio.play().catch(function(err){
        console.log(err);
      }).finally(function(){
        self.dingDone = true;
      });
      if(callback)
        callback(true);
    }
    else if(callback){
      callback(false);
    }
  }
  this.ding = this.ding.bind(this);


  this.onNotifications = function(notifs){
    try{
      this.notifications([]);
      if(!notifs){
        // console.log('no new notifications.');
      }
      for(var i = 0; i < notifs.length; i++){
        this.binNotification(notifs[i]);
      }
      this.isVisible(this.notifications().length > 0);
    }
    catch(err){
      console.log(err);
      console.error('Something went wrong receiving the notifications.');
    }
  }
  this.onNotifications = this.onNotifications.bind(this);


  this.binNotification = function(rawNotif){
    var type = rawNotif.type;
    var wrappedNotif = null;
    var host = this._remoteService.getServerURL();

    switch(type){

        case 'chat':
          wrappedNotif = new UnseenChatNotification(rawNotif, host);
          this.notifications.unshift(wrappedNotif);
          break;

        case 'seen-chat':
          wrappedNotif = new ViewedChatNotification(rawNotif, host);
          this.notifications.push(wrappedNotif);
          break;

        case 'forum':
          wrappedNotif = new ForumNotification(rawNotif, host);
          this.notifications.push(wrappedNotif);
          break;

        default:
            throw new Error(type + ' is an unknown notification type.');
        }
  }



  this.openNotifications = function(){
    this.isNotifcationsOpen(true);
  }


  this.closeNotifications = function(){
    this.isNotifcationsOpen(false);
  }
  this.closeNotifications = this.closeNotifications.bind(this);




}; // end NotificationViewModel constructor.


return {
    viewModel: NotificationViewModel,
    template :template
};

}); // end define.
;

define('text!class-list/template.html',[],function () { return '<link rel="stylesheet" href="./styles/components/person-panel/class-list.css?v=2.2">\n<div id="people-holder"\n    class="show-vert-scroll"\n    data-bind=\'visible: isVisible() == true\'>\n\n  <div class="person-list-wrapper">\n      <div id="no-members-yet" data-bind="visible:classmateList().length < 1">\n        No one is in this classroom yet.\n      </div>\n      <ul class="person-list"\n          data-bind="foreach:classmateList">\n\n            <li class="person-row"\n                draggable="false"\n                data-bind="click:$parent.classmateClicked,\n                           css:{\'person-row-selected\':$parent.selectedClassmate().getId() == getId(),\n                                \'professor-highlight\':getRole() == \'Professor\',\n                                \'professor-selected\':getRole() == \'Professor\' && $parent.selectedClassmate().getId() == getId()}">\n              <span class="name person-name disable-select"\n                    data-bind="text:getFirst() + \' \' + getLast()">\n                    name\n              </span>\n              <span class="shared-classes disable-select" data-bind="visible:getSharedClassCount() > 1">\n                In <span data-bind="text:getSharedClassCount()"></span> of your classes.\n              </span>\n\n              <div class="dot presence-dot person-panel-dot-position"\n                   data-bind="visible:isPresent()">\n              </div>\n\n              <div class="last-seen"\n                   data-bind="visible:isPresent() == false, text:getLastLogin()"></div>\n\n\n              <div class="person-banner">\n                <div class="person-pic-holder">\n                  <img class="person-pic disable-select"\n                       draggable="false"\n                       data-bind="attr:{src:getSmallPhotoURL()}"/>\n\n                </div>\n              </div>\n              <div class="bevel"\n                   data-bind="css:{\'side-bevel\':$parent.selectedClassmate().getId() == getId()}">\n              </div>\n              <div id="hover-show-bevel"\n                  class="bevel side-bevel">\n              </div>\n              <span class="add-pal-btn-holder">\n                      <button class="add-pal add-pal-btn"\n                              data-bind="click:$parent.addPal">\n                              add friend\n                      </button>\n              </span>\n            </li>\n        </ul>\n\n   </div>  <!-- person panel wrapper.   -->\n</div>\n';});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('class-list/Component',['ko',
        'dispatcher/Dispatcher',
        'text!class-list/template.html',
        'people-models/NullPerson',
        'people-store/PeopleStore'],

function(ko,
         Dispatcher,
         template,
         NullPerson,
         PeopleStore){

  function ViewModel(params,componentInfo){

    this.dis = new Dispatcher();
    this.store = PeopleStore.getInstance();
    this.isVisible = ko.observable(false);
    this.groupInfo = ko.observable({
      courseCode:'Coursecode'
    });
    this.yourAMember = false;
    this.isCourseJoinedMessageVisible = ko.observable(false);
    this.classmateList = ko.observableArray([]);
    this.classmateList.extend({notify:'always'});
    this.selectedClassmate = ko.observable(new NullPerson());



    this.onStoreUpdated = function(){
      var visible = this.store.isClassListVisible();
      this.isVisible(visible);
      if(visible){
        var classmates = this.store.getClassList();
        classmates.sort(function(a,b){
          if(a.getScore() > b.getScore()){
            return -1;
          }
          else if(a.getScore() < b.getScore()){
            return 1;
          }
          else{
            return a.getFirst() > b.getFirst();
          }

        })
        this.classmateList(classmates);
      }
    }
    this.onStoreUpdated = this.onStoreUpdated.bind(this);
    this.store.sub(this.onStoreUpdated);


    this.setStore = function(store){
      this.store = store;
    }

    this.getClassmateCount = function(){
      return this.classmateList().length;
    }

    this.classmateClicked  = function(classmate){
      var p = Object.getPrototypeOf(classmate);
      classmate._id = p._id;
      this.dis.dispatch('focusPerson', classmate);
      this.selectedClassmate(classmate);
    }
    this.classmateClicked = this.classmateClicked.bind(this);

    this.onCourseViewSelected = function(){
      var nullPerson = new NullPerson();
      this.selectedClassmate(nullPerson);
    }
    this.onCourseViewSelected = this.onCourseViewSelected.bind(this);
    this.dis.reg('showGroupView', this.onCourseViewSelected);


    this.getSelectedFriendId = function(){
      return this.selectedClassmate().getId();
    }


    this.peopleSubscription = null;
    this.registerPeopleListChangeCallback = function(callback){
      this.peopleSubscription = this.people.subscribe(callback, this, "arrayChange");
    }

    this.unregisterPeopleListChangeCallbacks = function(){
      this.peopleSubscription.dispose();
    }


    this.updateView = function(){
      this.people.valueHasMutated();
    }
    this.updateView = this.updateView.bind(this);

    this.addPal = function(classmate, e){
      e.stopPropagation();
      this.dis.dispatch('addPal',classmate);
    }
    this.addPal = this.addPal.bind(this);

  }; // end viewModel.

  return {
    viewModel: ViewModel,
    template : template
  }

});


define('text!course/course-controls/template.html',[],function () { return '\n<link rel="stylesheet"\n      href="./styles/components/course/course-controls.css?v=1.0">\n\n<div id="course-controls"\n     data-bind="visible:isVisible()">\n\n     <div id="tab-selector">\n\n       <span class="course-tab-selector disable-select"\n             data-bind="click:selectForum">\n            Forum\n         <span class="course-tab-underline">\n         </span>\n         <span class="visible-tab-underline"\n               data-bind="visible: forumSelected()">\n        </span>\n       </span>\n\n\n       <span class="course-tab-selector disable-select"\n             data-bind="click:selectClassList">\n            Class List\n           <span class="course-tab-underline"\n              data-bind="visible: classListSelected()">\n           </span>\n       </span>\n\n\n\n\n\n       <span class="course-tab-selector disable-select"\n              data-bind="click:selectPracticeTests">\n           Practice Tests\n         <span class="course-tab-underline"></span>\n         <span class="visible-tab-underline"\n               data-bind="visible: practiceTestsSelected()">\n        </span>\n       </span>\n     </div>\n\n     <in-another-section-prompt></in-another-section-prompt>\n     <forum></forum>\n     <class-list></class-list>\n     <practice-tests></practice-tests>\n</div>\n';});

define('course/models/Location',[],
function(
){

  function Location(data){

    if(!data || typeof data != 'object'){
      throw new Error('Location constructor expects an object as an argument.');
    }

    this.getConstructorName = function(){
      return 'Location';
    }

    this._validateNonEmptyString = function(s, errorMessage){
      if(!errorMessage){
        throw new Error('_validateNonEmptyString must be supplied with a errorMessage');
      }
      if(!s|| typeof s != 'string' || s.length < 1){
        throw new Error(errorMessage);
      }
    }


    this.setId = function(id){
      if(!id || isNaN(id) || id < 1){
        throw new Error('id must be a postive integer.');
      }
      this._locationId = id;
    }
    this.setId(data.location_id);

    this.getId = function(){
      return this._locationId;
    }


    this.setLocationName = function(name){
      this._validateNonEmptyString(name, 'location name must be a non-empty string.');
      this._locationName = name;
    }
    this.setLocationName(data.location_name);


    this.getLocationName = function(){
      return this._locationName;
    }




    this.setServerURLPrefix = function(prefix){
      this._validateNonEmptyString(prefix, 'prefix must be a non-empty string.');
      this._serverURLPrefix = prefix;
    }

    this.getServerURLPrefix = function(){
      return this._serverURLPrefix;
    }

    this.setLocationImageURL = function(url){
      this._validateNonEmptyString(url, 'url must be a non-empty string.');
      this._imgURL = url;
    }
    this.setLocationImageURL(data.img_url);


    this.getLocationImageURL = function(){
      var prefix = this.getServerURLPrefix();
      return prefix + '/' + this._imgURL + '?' + (new Date()).getTime();
    }


  } // end class.

  return Location;
});

define('course/models/CourseGroup',['course/models/Location'],
function(Location){

  function CourseGroup(data){


    if(!data || typeof data != 'object'){
      throw new Error('CourseSection constructor expects an object as an argument.');
    }

    this.getConstructorName = function(){
      return 'CourseGroup';
    }

    this._validateId = function(id, errorMessage){
      if(!id || isNaN(id) || id < 1){
        throw new Error(errorMessage);
      }
    }

    this._validateNonEmptyString = function(s, errorMessage){
      if(!errorMessage){
        throw new Error('_validateNonEmptyString must be supplied with a errorMessage');
      }
      if(!s|| typeof s != 'string' || s.length < 1){
        throw new Error(errorMessage);
      }
    }


    this.setId = function(grpId){
        this._validateId(grpId, 'groupId must be a postive integer.');
        this.groupId = grpId;
    }
    this.setId(data.group_id);



    this.getId = function(){
      return this.groupId;
    }



    this._validateNonEmptyString(data.section_letter, 'section_letter must a non-empty string.');
    this._sectionLetter = data.section_letter;
    this.getSectionLetter = function(){
      return this._sectionLetter;
    }


    this.setBuilding = function(building){
      if(!building || typeof building != 'string'){
        throw new Error('building cant be empty');
      }
      this.building = building;
    }
    this.setBuilding(data.building_name);


    this.getBuilding = function(){
      return this.building;
    }


    this.setServerPrefix = function(prefix){
      this._validateNonEmptyString(prefix, 'serverPrefix must be a non-empty string.');
      this.prefix = prefix;
    }


    this.getServerPrefix = function(){
      return this.prefix;
    }

    this.inAnotherSection = function(){
      return this.isInAnotherSection;
    }

    this.setInAnotherSection = function(bool){
      if(typeof bool != 'boolean'){
        throw new Error('bool must be a boolean.');
      }
      this.isInAnotherSection = bool;
    }
    this.setInAnotherSection(data.in_another_section);


    this.setImgUrl = function(imgUrl){
      this.imgUrl = imgUrl;
    }
    this.setImgUrl(data.img_url);


    this.getImgUrl = function(){
      return this.prefix + '/' + this.imgUrl;
    }

    this.setDept = function(dept){
      this._validateNonEmptyString(dept, 'dept must be non-empty.');
      this.dept = dept;
    }
    this.setDept(data.dept);


    this.getDept = function(){
      return this.dept;
    }

    this.getCourseCode = function(){
      return this._courseCode;
    }

    this.setCourseCode = function(code){
      this._validateNonEmptyString(code, 'course_code must be a non-empty string.');
      this._courseCode = code;
    }
    this.setCourseCode(data.course_code);



    this.getCourseDescription = function(){
      return this.description;
    }

    this.setCourseDescription = function(description){
      this._validateNonEmptyString(description, "description must be a non-empty string.");
      this.description = description;
    }
    this.setCourseDescription(data.description);


    this.setMembershipStatus = function(status){
      if(typeof status !== 'boolean'){
        throw new Error('membership status must be a boolean');
      }
      this.isMemberStatus = status;
    }
    this.setMembershipStatus(data.is_member);



    this.isMember  = function(){
      return this.isMemberStatus;
    }




  } // end class.

  CourseGroup.getRaw = function(){
    return {
      group_id:1,
      dept:'EECS',
      course_code:"FAKE101",
      description:'Fake Course',
      section_letter:'A',
      is_member:true,
      in_another_section: false,
      building_name:'Accolade East',
      room_name:'001'
    }
  }

  CourseGroup.getFake = function(){
    var grp = new CourseGroup(CourseGroup.getRaw());
    grp.setServerPrefix('http://host');
    return grp;
  }




  return CourseGroup;
});

define('course/models/ForumMessage',['ko','text-utilities'],
function(
  ko,
  testUtils){

  var ForumMessage = function(message){


      this.getConstructorName = function(){
        return "ForumMessage";
      }

      this.imgTag = ko.observable('');

      this.timestamp = message.timestamp;
      this.first = message.first;
      this.last = message.last;

      this.setFromSelf = function(bool){
        this.isSelf = bool;
      }
      this.setFromSelf(message.from_self);


      this.setFromFriend = function(){
        this.isSelf = false;
      }

      this.setGroupId = function(gId){
        if(!gId || Number.isInteger(gId) == false){
          throw new Error('group_id is missing or malformed.');
        }
        this.groupId = gId;
      }
      this.setGroupId(message.group_id);


      this.getGroupId = function(){
        return this.groupId;
      }


      this.setSenderImgUrl = function(url){
        if(!url || typeof url != 'string' || url.length < 1){
          throw new Error('sender_img_url is malformed.');
        }
        this.sender_img_url = url;
      }
      this.setSenderImgUrl(message.sender_img_url);


      this.setImgUrlPrefix = function(host){
        if(!this.isHostSet){
          this.sender_img_url =  host + "/" + this.sender_img_url;
        }
        else{
          throw new Error('host has already been set on this forum message.');
        }
      }

      this.getImgUrl = function(){
        return this.sender_img_url;
      }


      this.getImgTag = function(){
        return this.imgTag();
      }

      this.hasImage = ko.computed(function(){
          return this.sender_img_url && this.sender_img_url.length > 0;
      },this);

      this.getText = function(){
        return this.text;
      }

      this.setText = function(text){
        if(typeof text == 'string' && text.length > 0){
          this.text = text;
        }
        else{
          throw new Error('text must be non-empty string');
        }
      }
      this.setText(message.text);

      this.isSelfMessage = function(){
        return this.isSelf == true;
      }

      this.setAsFriend = function(){
        this.isSelf = false;
      }

      this.getHTML = function(){
        var text = this.getText();
        if(this.isSelfMessage()){
            return testUtils.wrapLinks(text,'forum-self-msg-link');
        }
        else{
          return testUtils.wrapLinks(text, 'forum-friend-msg-link');
        }
      }



  }; // end view model.


    ForumMessage.getRaw = function(){
      return {
        group_id:1,
        text:'text',
        timestamp:"2 min ago.",
        first:'chris',
        last:'kerley',
        isSelf:true,
        sender_img_url:'123.jpeg'
      };
    }

  ForumMessage.getFake = function(){
    return new ForumMessage(ForumMessage.getRaw(), 'http://forum.localhost');
  }

  ForumMessage.createSelfMessage = function(text, gId){
    return new ForumMessage({
        first: "",
        from_self: true,
        sender_img_url:'http',
        text: text,
        timestamp: "moments ago.",
        group_id:gId
    });
  }

  return ForumMessage;
});

define('course/models/ForumMessageCollection',['course/models/ForumMessage'],
function(ForumMessage){

  var ForumMessageCollection = function(){

    this.msgs = [];

    this.getConstructorName = function(){
      return "ForumMessageCollection";
    }

    this.getSize = function(){
      return this.msgs.length;
    }

    this.add = function(msg){
      if(typeof msg != 'object' || !msg.getConstructorName ||  msg.getConstructorName() != 'ForumMessage'){
        throw new Error('can only add ForumMessages.');
      }
      this.msgs.push(msg);
    }

    this.get = function(i){
      return this.msgs[i];
    }

    /**
    returns an Array<ForumMessage>
    */
    this.toArray = function(){
      return this.msgs;
    }


    this.clear = function(){
      this.msgs = [];
    }

  }; // end view model.

  ForumMessageCollection.getFake = function(){
      return new ForumMessageCollection();
  }


  return ForumMessageCollection;
});

define('course/CourseRemoteService',['ActiveRemoteService',
        'socketio',
        'dispatcher/Dispatcher',
        'people-models/Pal',
        'course/models/CourseGroup',
        'course/models/ForumMessageCollection',
        'course/models/ForumMessage'],
function(ActiveRemoteService,
         io,
         Dispatcher,
         Pal,
         CourseGroup,
         ForumMessageCollection,
         ForumMessage){


var CourseRemoteService = function(){

    this.dis = new Dispatcher();
    this.constructor = CourseRemoteService;
    Object.setPrototypeOf(this,new ActiveRemoteService());
    this.setMicroServer("course");


    this.init = function(auth){
      this.setSock();
      this.sock.on('io_error',this.somethingBadHappened);
      this.sock.on('error',this.somethingBadHappened);
      this.sock.on('disconnect',this.somethingBadHappened);
      this.sock.on('connect', this.getLastCourseLoaded);
      this.sock.on('classmateCourses', this.onClassmateCourses);
      this.sock.on('courseLeft', this.onCourseLeft);
      this.sock.on('coursePhotoUpdate',this.onCoursePhotoUpdate);
      this.sock.on('forumMessages', this.onForumMessageCollectionReceived);
      this.sock.on('forumMessageReceived',this.onForumMessageReceived);
      this.sock.on('groupInfo', this.onGroupReceived);
      this.sock.on('groupJoined', this.onGroupJoined);
    }
    this.init = this.init.bind(this);


    this.onAuth = function(auth){
      if(auth && auth.state == 'authenticated'){
        this.init();
      }
    }
    this.onAuth = this.onAuth.bind(this);
    this.dis.reg('authState', this.onAuth);



    this.somethingBadHappened = function(err){
      console.log('Something bad happened:');
      console.log(err);
    }


    this.onCourseLeft = function(grpId){
      this.dis.dispatch('courseLeft', grpId);
    }
    this.onCourseLeft = this.onCourseLeft.bind(this);

    this.getLastCourseLoaded = function(){
      this.sock.emit('getLastCourseLoaded');
    }
    this.getLastCourseLoaded = this.getLastCourseLoaded.bind(this);


    this.getClassmatesCourses = function(person){
      this.sock.emit('getCurrentCoursesFor',person);
    }
    this.getClassmatesCourses = this.getClassmatesCourses.bind(this);
    this.onPalFocusId = this.dis.reg('focusPerson', this.getClassmatesCourses);

    /**
      raw: an array of course groups.
    */
    this.onClassmateCourses = function(raw){

      if(!raw.classmatesId || Number.isInteger(raw.classmatesId) == false || raw.classmatesId < 1){
        throw new Error('classmatesId must be a positive integer.');
      }
      var grps = [];
      var rawGrps = raw.grps;
      var classmatesId = raw.classmatesId;
      rawGrps.forEach(rawGrp =>{
        grps.push(new CourseGroup(rawGrp));
      })
     this.dis.dispatch('classmateCourses', {classmatesId:classmatesId, grps:grps});
    }
    this.onClassmateCourses = this.onClassmateCourses.bind(this);


    this.onSwitchCourse = function(grp){
      this.sock.emit('switchToCourseGroup', grp);
    }
    this.onSwitchCourse = this.onSwitchCourse.bind(this);
    this.dis.reg('switchToCourseGroup', this.onSwitchCourse);


    this.onGroupReceived = function(data){
      var group = new CourseGroup(data);
      group.setServerPrefix(this.getServerURL());
      this.dis.dispatch('groupInfo', group);
      this.joinGroupForum(group.getId());
    }
    this.onGroupReceived = this.onGroupReceived.bind(this);


    this.getCourseGroup = function(groupId){
      this.sock.emit('getCourseGroup', groupId);
    }
    this.getCourseGroup = this.getCourseGroup.bind(this);
    this.getGroupId = this.dis.reg('selectedGroupId',this.getCourseGroup);


    this.registerOnIsProfilePhotoSet = function(callback){
      this._checkType(callback);
      this.onIsProfilePhotoSet = callback;
    }


    this.joinCourse = function(grpId){
      this.sock.emit('joinCourse', grpId);
    }
    this.joinCourse = this.joinCourse.bind(this);
    this.joinCourseId = this.dis.reg('joinCourse',this.joinCourse);


    this.onGroupJoined = function(groupId){
      this.dis.dispatch('groupJoined', groupId);
    }
    this.onGroupJoined = this.onGroupJoined.bind(this);


    this.leaveCourseGroup = function(courseId){
      if(isNaN(courseId) || !courseId){
        throw new Error('courseId must be a number');
      }
      this.sock.emit('leaveCourseGroup', courseId);
    }


    this.onForumMessageReceived = function(rawMessage){
      var msg = new ForumMessage(rawMessage);
      msg.setImgUrlPrefix(this.getServerURL());
      this.dis.dispatch('forumMessageReceived', msg);
    }
    this.onForumMessageReceived = this.onForumMessageReceived.bind(this);


    this.sendForumMessage = function(message){

      this.sock.emit('sendForumMessage',message);
    }
    this.sendForumMessage = this.sendForumMessage.bind(this);
    this.sendForumMessageId = this.dis.reg('sendForumMessage',this.sendForumMessage);


    this.sendImage = function(courseId, base64Image, text){
      if(!courseId || typeof courseId != 'number' || courseId < 1){
        throw new Error("courseId must be a postive integer.");
      }
      var regex = new RegExp('base64');
      if(typeof base64Image != 'string' || regex.test(base64Image) == false){
        throw new Error("base64Image must be a base64 string.");
      }
      var data = {
        courseId: courseId,
        base64:base64Image,
        text:text
      }
      this.sock.emit('imageUpload', data, this.onImageSent);
    }


    this.registerOnImageSent = function(callback){
      this._checkType(callback);
      this.onImageSent = callback;
    }


    this.registerOnMessagesReceived = function(callback){
      this._checkType(callback);
      this.onMessagesReceived = callback;
    }

    this.onGetMessagesError = function(a, b, err){
      console.log(err);
    }


    this.joinGroupForum = function(grpId){
      this.sock.emit('joinGroupForum',grpId);
    }
    this.joinGroupForum = this.joinGroupForum.bind(this);



    this.onForumMessageCollectionReceived = function(raw){
      if(Array.isArray(raw) == false){
        throw new Error('raw is expected to be an array.');
      }
      var col = new ForumMessageCollection();
      for(var i = 0; i < raw.length; i++){
        var msg = new ForumMessage(raw[i]);
        msg.setImgUrlPrefix(this.getServerURL());
        col.add(msg);
      }
      this.dis.dispatch('forumMessages', col);
    }
    this.onForumMessageCollectionReceived = this.onForumMessageCollectionReceived.bind(this);


    this.registerOnCheckedInLocation = function(callback){
      this._checkType(callback);
      this.onCheckInLocation = callback;
    }

    this.emitLocation = function(courseId, position){
      if(typeof location != 'object'){
        throw new Error('location must be an object');
      }
        var tmp = {
          coords:{
            accuracy:position.coords.accuracy,
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
          },
          timestamp:position.timestamp
        }
      this._checkType(this.onCheckInLocation);
      var data = {
        courseId:courseId,
        location:tmp
      }
      var json = JSON.stringify(data);
      this.sock.emit('checkInLocation', json, this.onCheckInLocation);
    }



    this.onSavePhoto = function(coursePhoto){
      this.sock.emit('saveCoursePhotograph', coursePhoto);
    }
    this.onSavePhoto = this.onSavePhoto.bind(this);
    this.onPhotoId = this.dis.reg('saveCoursePhotograph', this.onSavePhoto);


    this.onCoursePhotoUpdate = function(photoUpdate){
      this.dis.dispatch('coursePhotoUpdate',photoUpdate);
    }
    this.onCoursePhotoUpdate = this.onCoursePhotoUpdate.bind(this);



    this._checkType = function(callback){
      if(typeof callback != 'function'){
        throw new Error('callback must be a function.');
      }
    }




}

return CourseRemoteService;
})
;
define('course/models/CourseSection',[],
function(
){

  function CourseSection(data){

    if(!data || typeof data != 'object'){
      throw new Error('CourseSection constructor expects an object as an argument.');
    }

    this.getConstructorName = function(){
      return 'CourseSection';
    }

    this.setSectionId = function(sectionId){
      if(isNaN(sectionId) || sectionId < 1 || Number.isInteger(sectionId) == false){
        throw new Error('sectionId must be a postive integer.');
      }
      this.sectionId = sectionId;
    }
    this.setSectionId(data.section_id);

    this.getId = function(){
      return this.sectionId;
    }

    this.setSectionLetter = function(sectionLetter){
      if(typeof sectionLetter != 'string' || sectionLetter.length < 1){
        throw new Error('sectionLetter must be a non empty string.');
      }
      this.sectionLetter = sectionLetter;
    }
    this.setSectionLetter(data.section_letter);

    this.getLetter = function(){
      return this.sectionLetter;
    }

  } // end class.

  // factory for creating lists of sections.
  CourseSection.makeSectionsArray = function(sections){
        var arr = [];
        if(Array.isArray(sections) == false || sections.length < 1){
          throw new Error('sections must be a non-empty array.');
        }
        for(var i = 0; i < sections.length; i++){
          var section = new CourseSection(sections[i]);
          arr.push(section);
        }
        return arr;
  };


  return CourseSection;
});

define('course/CourseStore',[
'jquery',
'ko',
'course/CourseRemoteService',
'dispatcher/Dispatcher',
'course/models/CourseGroup',
'course/models/CourseSection',
'course/models/ForumMessage',
'course/models/ForumMessageCollection'],
function(
  $,
  ko,
  CourseRemoteService,
  Dispatcher,
  CourseGroup,
  CourseSection,
  ForumMessage,
  ForumMessageCollection){


      var Store = {};
      var _dis = new Dispatcher();
      var _remoteService = new CourseRemoteService();
      var _onPub = null;
      var _subscribers = [];

      var _isWaiting = false;  // used for spinners, (usually waiting for server response.)
      var _isWaitingToJoin = false;
      var _userHasProfilePhoto = false;
      var _waitingForRequiredPhoto = false;
      var  _showThankYouMessage = false;


      var _group = null;
      var _classmatesCourseGroups = [];
      var _classmatesId = null;
      var _isGroupViewVisible = false;


      var _forumMessages = new ForumMessageCollection();
      var _forumMsgWasFromSelf = false;
      var _isForumSelected = false;
      var _isClassListSelected = false;
      var _isPracticeTestsSelected = false

      var _pub = function(){
        _subscribers.forEach(function(e){
          e();
        })
        if(typeof _onPub == 'function'){
          _onPub();
        }
      }


      Store.group = ko.observable({});

      Store.isThankYouForUploadingPhotoMessageVisible = ko.observable(false);


      Store.getDis = function(){
        return _dis;
      }


      Store.getRemoteService = function(){
        return _remoteService;
      }

      Store.selectForum = function(){
        _isForumSelected = true;
        _isClassListSelected = false;
        _isPracticeTestsSelected = false;
        _dis.dispatch('hideClassList');
        _pub();
      }
      Store.forumSelectedCallbackId = _dis.reg('forumSelected', Store.selectForum);

      Store.isForumSelected = function(){
        return _isForumSelected;
      }

      Store.selectClassList = function(){
        _isForumSelected = false;
        _isClassListSelected = true;
        _isPracticeTestsSelected = false;
        _pub();
      }
      Store.classSelectId = _dis.reg('showClassList', Store.selectClassList);

      Store.isClassListSelected = function(){
        return _isClassListSelected;
      }

      Store.selectPracticeTests = function(){
        _isForumSelected = false;
        _isClassListSelected = false;
        _isPracticeTestsSelected = true;
        _dis.dispatch('hideClassList');
        _pub();
      }
      Store.practiceTestsSelectedCallbackId = _dis.reg('practiceTestsSelected', Store.selectPracticeTests);

      Store.isPracticeTestsSelected = function(){
        return _isPracticeTestsSelected;
      }


      Store.setImageURLPrefix = function(obj){
        var serverPrefix = _remoteService.getServerURL();
        if(obj. sender_img_url){
          obj.sender_img_url = serverPrefix + '/' + obj. sender_img_url + '?' + (new Date()).getTime();
        }
      }



    Store.setExperimentalMode = function(userId){
        var group = userId % 2;
        if(group == 0){   // Don't require photo to join.
          Store.isExperimentalGroup = false
        }
        else if(group == 1){ // Require the photo to join.
          Store.isExperimentalGroup = true;
        }
    }

  Store.setCurrentCourseGroup = function(group){
    if(!group || group.getConstructorName() != 'CourseGroup'){
      throw new Error('group must be an instance of CourseGroup.');
    }
    _group = group;
  }

  Store.onClassmateCourseGroups = function(grpsAction){
    grpsAction.grps.forEach(function(e){
      if(e instanceof CourseGroup == false){{
        throw new Error('All groups must be a CourseGroup.');
      }}
    })
    _classmatesCourseGroups = grpsAction.grps;
    _classmatesId = grpsAction.classmatesId;
    _pub();
  }
  Store.onPalsCoursesId = _dis.reg('classmateCourses', Store.onClassmateCourseGroups);

  Store.getClassmatesId = function(){
    return _classmatesId;
  }


  Store.getClassmateCourseGroups = function(){
    return _classmatesCourseGroups;
  }

  Store.isGroupViewVisible = function(){
    return _isGroupViewVisible;
  }

  Store.setGroupViewVisible = function(){
    _isGroupViewVisible = true;
    _pub();
  }

    Store.openGroupView = function(){
      _isGroupViewVisible = true;
      Store.selectForum();
    }
    _dis.reg('showGroupView', Store.openGroupView);



    Store.closeGroupView = function(){
      _isGroupViewVisible = false;
      _pub();
    }
    _dis.reg('closeGroupView',Store.closeGroupView);


    Store.onFocusPerson = function(){
      _isGroupViewVisible = false;
      _pub();
    }
  _dis.reg('focusPerson', Store.onFocusPerson);


    Store.getGroupId = function(){
      return _group.getId();
    }


    Store.isGroupMember = function(){
      return _group.isMember();
    }


    Store.onCourseGroupJoined = function(groupId){
      if(!groupId || isNaN(groupId) || groupId < 1){
        throw new Error('groupId is malformed.');
      }
      if(groupId !== _group.getId()){
        throw new Error('groupId does not match currently selected groupId');
      }
      _group.setMembershipStatus(true);
      _pub();
      _isWaitingToJoin = false;
    }
    Store.grpJoinedId = _dis.reg('groupJoined', Store.onCourseGroupJoined);


    Store.isWaiting = function(){
      return _isWaiting;
    }


    Store.onSaveCoursePhotograph = function(){
      _isWaiting = true;
      _pub();
    }
    Store.onSaveCoursePhotograph = Store.onSaveCoursePhotograph.bind(this);
    _dis.reg('saveCoursePhotograph', Store.onSaveCoursePhotograph);

    Store.isWaitingToJoin = function(){
      return _isWaitingToJoin;
    }

    Store.setWaitingToJoin = function(){
      _isWaitingToJoin = true;
    }

    Store.onJoinCourse = function(){
      Store.setWaitingToJoin();
      _pub();
    }
    _dis.reg('joinCourse', Store.onJoinCourse);


    Store.onCoursePhotoUpdate = function(update){
      if(update.groupId == _group.getId()){
        _group.setImgUrl(update.imgUrl);
        _pub();
      }
    }
    _dis.reg('coursePhotoUpdate',Store.onCoursePhotoUpdate);


    Store.onLeaveSelectedCourse = function(){
      var groupId = _group.getId();
      _remoteService.leaveCourseGroup(groupId);
    }
    _dis.reg('leaveSelectedCourse', Store.onLeaveSelectedCourse);


    Store.onCourseLeft = function(groupId){
      if(groupId === _group.getId()){
        _group.setMembershipStatus(false);
        _group.setInAnotherSection(false);
        _pub();
      }
    }
    Store.onCourseLeft = Store.onCourseLeft.bind(this);
    Store.courseLeftId = _dis.reg('courseLeft',Store.onCourseLeft);


    Store.getCurrentGroup = function(){
      return _group;
    }

    Store.onCourseGroupReceived = function(grp){
      _group = grp;
      Store.openGroupView();
    }
    Store.groupReceivedId = _dis.reg('groupInfo', Store.onCourseGroupReceived);



    Store.getGroupInfo = function(){
      return _group;
    }

    Store.onCheckInLocation = function(location){
      var groupId = _group.getId();
      _remoteService.emitLocation(groupId, location);
    }
    Store.checkInLocationCallbackId = _dis.reg('checkInLocation', Store.onCheckInLocation);

    /**
      Handles special cases where the user is
      requested to upload a photo to join a group.
    */
    Store.onUserInfo = function(info){

      info.large_photo_url ? _userHasProfilePhoto = true : _userHasProfilePhoto = false;
      if(Store.userHasProfilePhoto() && Store.isWaitingForRequiredPhoto()){
        Store.setShowThankYouMessage(true);
        Store.setWaitingForRequiredPhoto(false);
      }
      _pub();
    }
    _dis.reg('profileUpdate', Store.onUserInfo);


    Store.setUserHasProfilePhoto = function(bool){
      _userHasProfilePhoto = bool;
    }

    Store.isWaitingForRequiredPhoto = function(){
      return _waitingForRequiredPhoto;
    }

    Store.setWaitingForRequiredPhoto = function(bool){
      _waitingForRequiredPhoto = bool;
    }

    Store.setShowThankYouMessage = function(bool){
      _showThankYouMessage = bool;
    }

    Store.showThankyouMessage = function(){
      return _showThankYouMessage;
    }

    /**
      When the user is prompted to join a grp and
      they do no have a photo yet and they have asked
      to open the profile setter.   we set a special
      flag so that when they do upload it photo it brings
      them back to the join group prompt.
    */
    Store.onShowProfileSetter = function(){
      if(Store.userHasProfilePhoto() == false){
        _waitingForRequiredPhoto = true;
      }
    }
    _dis.reg('showProfileSetter',Store.onShowProfileSetter);


    Store.userHasProfilePhoto = function(){
      return _userHasProfilePhoto;
    }


    Store.hasJoinedForum = ko.observable(false); // NOT DONE
    _forumMessageSuccessfullySent = false;


    Store.onForumMessageCollectionReceived = function(msgs){
      if(typeof msgs != 'object' || msgs instanceof ForumMessageCollection == false){
           throw new Error("ForumMessageCollection expected");
      }
      _forumMessages = msgs;
      _pub();
    }
    Store.forumMessagesId = _dis.reg('forumMessages', Store.onForumMessageCollectionReceived);



    Store.setForumMessages = function(msgs){
      if(msgs instanceof ForumMessageCollection){
        _forumMessages = msgs;
      }
      else{
        throw new Error('msgs is expected to be a ForumMessageCollection!');
      }
    }

    Store.getForumMessages = function(){
      return _forumMessages;
    }

    Store.onForumMessageReceived = function(msg){
      if(typeof msg != 'object' || msg instanceof ForumMessage == false){
        throw new Error("msg must be a ForumMessage");
      }
      if(msg.getGroupId() == Store.getCurrentGroup().getId()){
        _forumMessages.add(msg);
        msg.isSelfMessage() ? Store.setWasFromSelf() : Store.setWasNotFromSelf();
        _pub();
      }
    }
    Store.forumMessageResId = _dis.reg('forumMessageReceived', Store.onForumMessageReceived);


    Store.setWasFromSelf = function(){
      _forumMsgWasFromSelf = true;
    }

    Store.setWasNotFromSelf = function(){
      _forumMsgWasFromSelf = false;
    }

    Store.wasLastMessageFromSelf = function(){
      return _forumMsgWasFromSelf;
    }




    Store.subscribe = function(fn){
      _subscribers.push(fn);
    }

    Store.publish = function(){
      _pub();
    }


    Store.onPub = function(fn){
      _onPub = fn;
    }

  return Store;

});

define('course-controls/Component',[
'ko',
'dispatcher/Dispatcher',
'text!course/course-controls/template.html',
'course/CourseStore'],
function(
  ko,
  Dispatcher,
  template,
  CourseStore
){


    var CourseHolderViewModel = function(){

      this.store = CourseStore;
      this.dis = new Dispatcher();
      this.isVisible = ko.observable(false);
      this.forumSelected = ko.observable(false);
      this.classListSelected = ko.observable(false);
      this.practiceTestsSelected = ko.observable(false);


      this.onStoreChanged = function(){
        var isGroupViewVisible = this.store.isGroupViewVisible();
        this.isVisible(isGroupViewVisible);
        if(isGroupViewVisible){
          this.forumSelected(this.store.isForumSelected());
          this.classListSelected(this.store.isClassListSelected());
          this.practiceTestsSelected(this.store.isPracticeTestsSelected());
        }
      }
      this.onStoreChanged = this.onStoreChanged.bind(this);
      this.store.subscribe(this.onStoreChanged);



      this.selectForum = function(){
        this.dis.dispatch('forumSelected');
      }

      this.selectClassList = function(){
        this.dis.dispatch('showClassList');
      }

      this.selectPracticeTests = function(){
        this.dis.dispatch('practiceTestsSelected');
      }
    } // end view model.

  return {
    viewModel:CourseHolderViewModel,
    template:template
  }

});


define('text!forum/template.html',[],function () { return '<link rel="stylesheet"\n      href="./styles/components/course/forum.css?v=1.2">\n\n<div id="classroom-holder"\n     data-bind="visible:isVisible()">\n\n     <!-- spinner -->\n     <div  class="screen-center-outer">\n      <div class="screen-center-inner">\n         <div class="loader"\n              data-bind="visible:isSpinnerVisible()">\n         </div>\n      </div>\n    </div>\n\n    <!-- question prompt -->\n\n  <div id="empty-forum-prompt"\n       data-bind="visible:messages().length <= 0 && isSpinnerVisible() == false">\n    <div>Not sure who to ask for help?</div>\n    <div>Post your questions here.</div>\n  </div>\n\n  <ul data-bind="foreach:messages"\n      id="classroom-messages"\n      class="show-vert-scroll">\n\n    <li class="forum-message"\n        data-bind="css:{ \'self-message\': isSelfMessage(), \'youtube-embed\' : /iframe/.test(getHTML()) }">\n\n      <!-- ko if: typeof getImgUrl() == \'string\' -->\n        <img data-bind="attr:{src:getImgUrl()}"\n             class="classroom-chat-img disable-select">\n        </img>\n      <!-- /ko -->\n\n      <!-- ko if: typeof getImgUrl() != \'string\' && isSelf == false -->\n        <img src="./assets/no-photo.jpg"\n             class="classroom-chat-img disable-select">\n        </img>\n      <!-- /ko -->\n\n\n\n      <span class="plain-text-post">\n        <span data-bind="html:getHTML()"\n              class="chat-text">\n        </span>\n        <span data-bind="text:timestamp"\n              class="classroom-timestamp disable-select">\n        </span>\n        <span data-bind="visible:isSelf == false, text:first + \' \' + last"\n              class="users-name">\n        </span>\n      </span>\n    </li>\n\n\n  </ul>\n\n\n\n\n  <div id="message-sender">\n\n      <div id="forum-message-sent"\n           data-bind="visible:showSent()">\n           sent!\n      </div>\n      <div id="forum-message-sent"\n           data-bind="visible:isSendingMessageVisible()">\n           sending.\n      </div>\n      <textarea id="forum-message-input-holder"\n              class="show-vert-scroll"\n             placeholder="Type your message here."\n             type="text"\n             data-bind="textInput:newMessage,\n                        event:{\'keydown\':onKeyPress} ,\n                        hasFocus: inputHasFocus(),\n                        click: inputClicked">\n      </textarea>\n      <button id="send-message-btn"\n              class="disable-select"\n              data-bind="enable:isValidInput(), click:sendForumMessage, css:{}">\n              SEND\n      </button>\n    </div>\n\n</div>\n<!--  end of course holder-->\n';});

define('forum/Component',[
'ko',
'text-utilities',
'text!forum/template.html',
'dispatcher/Dispatcher',
'course/models/ForumMessage',
'course/CourseStore'],
function(
  ko,
  TextUtilities,
  template,
  Dispatcher,
  ForumMessage,
  CourseStore){

  function ForumViewModel(){

    this.dis = new Dispatcher();
    this.store = CourseStore;
    this.messages = ko.observableArray([]);
    this.newMessage = ko.observable('');
    this.isVisible = ko.observable(false);
    this.isSpinnerVisible = ko.observable(false);
    this.inputHasFocus = ko.observable(false);
    this.isNewFeatureVisible = ko.observable(false);
    this.isSendingMessageVisible = ko.observable(false);
    this.showSent = ko.observable(false);
    this.hasBeenInitialized = false;


    this.onStoreChanged = function(){
      var group = this.store.getGroupInfo();
      if(!group || group.getConstructorName() != 'CourseGroup'){
        return;
      }
      this.isVisible(this.store.isForumSelected());
      this.inputHasFocus(this.store.isForumSelected());
      this.populateMessages();
      this.store.wasLastMessageFromSelf() ? this.onMessageSent() : "";
    }
    this.onStoreChanged = this.onStoreChanged.bind(this);
    this.store.subscribe(this.onStoreChanged, this);

    this.onMessageSent = function(){
      this.inputHasFocus(true);
      this.isSendingMessageVisible(false);
      this.showSent(true);
      var self = this;
      if(self.sentId){
        clearTimeout(self.sentId);
      }
      self.sentId = setTimeout(function(){
        self.showSent(false);
      },2000);
    }
    this.onMessageSent = this.onMessageSent.bind(this);


    this.populateMessages = function(){
      var messages = this.store.getForumMessages().toArray();
      this.messages([]);
      for(var i = 0; i < messages.length; i++){
        this.messages.unshift(messages[i]);
      }
      this.isSpinnerVisible(false);
    }
    this.populateMessages = this.populateMessages.bind(this);

    this.newMessage.subscribe(function(text){
      if(/\S/.test(text)){
        this.isValidInput(true);
      }
      else{
        this.isValidInput(false)
      }
    },this);
    this.isValidInput = ko.observable(false);


    this.onKeyPress = function(vm, event){
      event.send = this.sendForumMessage;
      return TextUtilities.onKeyPress(event);
    }
    this.onKeyPress = this.onKeyPress.bind(this);


    this.sendForumMessage = function(){
      var text = this.newMessage();
      text = TextUtilities.formatToHTML(text);
      var grpId = this.store.getCurrentGroup().getId();
      var msg = ForumMessage.createSelfMessage(text, grpId);
      this.messages.unshift(msg);
      this.dis.dispatch('sendForumMessage',msg);
      this.newMessage('');
      this.isSendingMessageVisible(true);
    }
    this.sendForumMessage = this.sendForumMessage.bind(this);

    this.appendMessage = function(message){
      if(message instanceof ForumMessage == false){
        throw new Error('expected messaged to be a ForumMessage');
      }
      this.messages.unshift(message);
    }
    this.appendMessage = this.appendMessage.bind(this);



    this.inputClicked = function(){
      this.inputHasFocus(true);
    }
}; // end view model.

  return {
    viewModel: ForumViewModel,
    template: template
  }
});


define('text!practice-tests/template.html',[],function () { return '<link rel="stylesheet"\n      href="./styles/components/course/practice-tests.css">\n\n\n  <div  id="join-to-access"\n        data-bind="visible:isUploadPhotoMessageVisible()">\n    Join to access to past exams\n    <i class="glyphicon glyphicon-arrow-right"></i>\n  </div>\n\n  <div id="practise-test-holder"\n       data-bind="visible:isVisible()">\n      <div id="practise-tests-title"\n           class="disable-select">\n          <span id="test-upload-button"\n                data-bind="click:openTestUploader,\n                           visible:isAdminUser()">\n                Upload\n          </span>\n      </div>\n\n      <div id="test-uploader"\n           class="window-holder"\n           data-bind="visible:isTestUploaderVisible(),\n                      complementClick:closeTestUploader">\n        <form id="test-uploader-form">\n\n          <div class="test-uploader-row-holder">\n\n            <div class="test-uploader-column">\n              <label for="test-type">Mid-term</label>\n              <input type="radio"\n                     class="test-uploader-click-input"\n                     name="test-type"\n                     value="Mid-term">\n              </input>\n            </div>\n\n            <div class="test-uploader-column">\n              <label for="test-type">\n                Final Exam\n              </label>\n              <input type="radio"\n                     class="test-uploader-click-input"\n                     name="test-type"\n                     value="Final Exam">\n              </input>\n            </div>\n\n          </div>\n\n\n          <div class="test-uploader-row-holder">\n            <div class="test-uploader-column">\n              <input type="checkbox"\n                     class="test-uploader-checkbox"\n                     id="test-type-has-solutions">\n              </input>\n            </div>\n            <div class="test-uploader-column">\n              <label for="test-type-has-solutions">\n                With solutions\n              </label>\n            </div>\n          </div>\n\n\n          <input type="number"\n                 min="1999"\n                 max="2100"\n                 id="test-year"\n                 placeholder="Year">\n          </input>\n          <input type="file"\n                 accept="application/pdf">\n          </input>\n          <input type="submit"\n                  data-bind="click:uploadTest">\n                  upload\n          </input>\n        </form>\n\n      </div>\n\n      <div id="no-practise-test-message"\n           data-bind="visible:tests().length <= 0 && isSpinnerVisible() != true">\n        There are no practise tests </br>\n        for this class yet.\n      </div>\n\n      <!-- spinner -->\n      <div  class="screen-center-outer">\n       <div class="screen-center-inner">\n          <div class="loader"\n               data-bind="visible:isSpinnerVisible()">\n          </div>\n       </div>\n     </div>\n\n      <!-- test list. -->\n      <div data-bind="foreach: tests">\n          <div class="term disable-select"\n               data-bind="text:year">\n          </div>\n          <div class="test-row"\n               data-bind="foreach: yearsTests">\n              <div  class="test-holder">\n                <a data-bind="attr:{href:file_url}, click:$parents[1].recordTestDownload"\n                   target="_blank">\n                    <img  class="image disable-select"\n                          src="./assets/practice_test.jpg">\n                    </img>\n                </a>\n                <div class="test-name disable-select"\n                     data-bind="text:name">\n                </div>\n               <button data-bind="click:$parents[1].deleteTest, visible:$parents[1].isAdminUser()">\n                 Delete\n               </button>\n              </div>\n          </div>\n      </div>\n  </div>\n';});

define('practice-tests/PracticeTestRemoteService',['ActiveRemoteService','format-converter'],
function(ActiveRemoteService, FormatConverter){


var CourseRemote = function(){

    this.constructor = CourseRemote;
    Object.setPrototypeOf(this,new ActiveRemoteService());
    this.setMicroServer("tests");


    this.registerOnRole = function(callback){
      this._checkType(callback);
      this.onRoleReceived = callback;
    }


    this.getRole = function(){
      var url = this.getServerURL() + '/getRole';
      $.ajax({
        url:url,
        type:'GET',
        beforeSend:this.setAuthorizationHeader,
        success:this.onRoleReceived,
        error:function(a,b,err){
          console.log(err);
        }
      });
    }

    this.registerOnPractiseTestsRecieved = function(callback){
      this._checkType(callback);
      this.onPractiseTestsRecieved = callback;
    }

    this.registerOnPractiseRetrievalError = function(callback){
      this._checkType(callback);
      this.onTestRetrievalError = callback;
    }

    this.getPractiseTests = function(groupId){

      var url = this.getServerURL() + '/' + groupId + '/practice_tests';
      $.ajax({
        url:url,
        type:'get',
        beforeSend:this.setAuthorizationHeader,
        success:this.onPractiseTestsRecieved,
        error:this.onTestRetrievalError
      });
    }

    this.registerOnTestCollectionChanged = function(callback){
      this._checkType(callback);
      this.onTestCollectionChanged = callback;
    }

    this.registerOnTestUploadError = function(callback){
      this._checkType(callback);
      this.onTestUploadError = callback;
    }

    this.saveFile = function(base64, courseId, testName, year){
      if(!courseId || isNaN(courseId)){
        throw new Error('courseId must be a parameter to save a Test File.');
      }
      if(!testName || typeof testName != 'string' || testName.length < 1){
        throw new Error('testName must be a string and included as a parameter.');
      }
      if(!year || typeof year != 'number' || year < 1900){
        throw new Error('year must be a number and included as a parameter.');
      }
      var url = this.getServerURL() + '/test_upload/' + courseId + '/' + year;
      var formData = new FormData();
      var blob = FormatConverter.base64ToBlob(base64);
      formData.append(testName, blob);
      $.ajax({
        url:url,
        type:'POST',
        data:formData,
        contentType:false,
        processData:false,
        beforeSend:this.setAuthorizationHeader,
        success:this.onTestCollectionChanged,
        error:this.onTestUploadError
      });
    }


    this.onCoursePhotoUploaded = function(result){
      console.log(result)
    }


    this.recordTestDownload = function(testId){

      var url = this.getServerURL() + '/practice_tests/' + testId + "/recordDownload";
      $.ajax({
        url:url,
        type:'POST',
        beforeSend:this.setAuthorizationHeader,
        success:function(){

        },
        error:function(a,b,err){
          console.log(err);
        }
      })
    }


    this.deleteTest = function(testId){
      var url = this.getServerURL() + '/practice_tests/' + testId;
      $.ajax({
        url:url,
        type:'DELETE',
        beforeSend:this.setAuthorizationHeader,
        success:this.onTestCollectionChanged,
        error:function(a,b,err){
          console.log(err);
        }
      })
    }

    this._checkType = function(callback){
      if(typeof callback != 'function'){
        throw new Error('callback must be a function.');
      }
    }
}

return CourseRemote;
})
;
define('practice-tests/Component',[
'jquery',
'ko',
'text!practice-tests/template.html',
'practice-tests/PracticeTestRemoteService',
'course/CourseStore'],
function(
  $,
  ko,
  template,
  PractiseTestRemoteService,
  CourseStore){

  function PracticeTestsViewModel(params, componentInfo){

    this.store = CourseStore;
    this.tests = ko.observableArray([]);
    this.isVisible = ko.observable(false);
    this.isUploadPhotoMessageVisible = ko.observable(false);
    this.isNoPractiseTestsMessageVisible = ko.observable(false);
    this.isTestUploaderVisible = ko.observable(false);
    this.isSpinnerVisible = ko.observable(false);
    this.isAdminUser = ko.observable(false);
    this.remote = new PractiseTestRemoteService();
    this._isInitialized = false;
    this.hasBeenInitialized = false;


    this.onReadyToLoad = ko.computed(function(){
      return this.isVisible() && this._isInitialized == true;
    },this);


    this.onStoreChanged = function(){
      var groupInfo = this.store.getGroupInfo();
      if(groupInfo && groupInfo.getConstructorName() == 'CourseGroup'){
        var isViewSelected = this.store.isPracticeTestsSelected();
        var isCourseMember = groupInfo.isMember();
        this.isUploadPhotoMessageVisible(!isCourseMember && isViewSelected);
        if(isCourseMember && isViewSelected){
          this.isSpinnerVisible(true);
          this.isVisible(true);
          this.registerRemoteHandlers();
          this.remote.getRole();
          this.remote.getPractiseTests(groupInfo.getId());
        }
        else{
          this.isVisible(false);
        }
      }
    }
    this.onStoreChanged = this.onStoreChanged.bind(this);
    this.store.subscribe(this.onStoreChanged);


    this.registerRemoteHandlers = function(){
      if(this._isInitialized == false){
          this.remote.registerOnPractiseTestsRecieved(this.onPractiseTestsRecieved);
          this.remote.registerOnPractiseRetrievalError(this.onRetrievalError);
          this.remote.registerOnTestCollectionChanged(this.onTestCollectionChanged);
          this.remote.registerOnTestUploadError(this.onTestUploadError);
          this.remote.registerOnRole(this.onRoleReceived);
          this._isInitialized = true;
      }
    }

    this.onRoleReceived = function(role){
      if(role == 'admin'){
        this.isAdminUser(true);
      }
      else{
        this.isAdminUser(false);
      }
    }
    this.onRoleReceived = this.onRoleReceived.bind(this);

    this.recordTestDownload = function(data){
      var testId = data.test_id;
      this.remote.recordTestDownload(testId);
      return true;
    }
    this.recordTestDownload = this.recordTestDownload.bind(this);

    this.onPractiseTestsRecieved = function(practiseTests){
      if(!practiseTests){
        throw new Error("practiseTests must be a JSON array");
      }
      this.isSpinnerVisible(false);
      var tests = JSON.parse(practiseTests);
      // console.log(tests);
      if(tests.length > 0){
        var sortedTests = this.sortByTime(tests);
        this.formatRemotePaths(sortedTests);
        var mostRecentToOldest = sortedTests.reverse();
        this.tests(mostRecentToOldest);
      }
      else{
        this.tests([]);
        this.isNoPractiseTestsMessageVisible(true);
      }
    }
    this.onPractiseTestsRecieved = this.onPractiseTestsRecieved.bind(this);



    this.sortByTime = function(tests){
      var sortedTests = [];
      for(var i = 0; i < tests.length; i++){
        var date = new Date(Date.parse(tests[i].year));

        var year = date.getYear() + 1900;
        tests[i].year = year;
        this.insertTest(tests[i], sortedTests);
      }
      return sortedTests;
    }

    this.insertTest = function(test, sortedTests){
      if(Array.isArray(sortedTests) == false){
        throw new Error('sortedTests must be an array.');
      }
      var tests = sortedTests;
      for(var i = 0; i < tests.length; i++){

        if(test.year == tests[i].year){
          tests[i].yearsTests.push(test);
          return;
        }
        else if(i < tests.length - 1 && tests[i].year < test.year && test.year < tests[i + 1].year){
          var newYear = this.createNewYear(test);
          tests.splice(i + 1, 0, newYear);
          return;
        }
        else if(test.year < tests[i].year && i == 0){
          var newYear = this.createNewYear(test);
          tests.splice(i,0,newYear);
          return;
        }
      } // end loop.

      // end of list reached, (must be the most recent year seen so far).
      var newYear = this.createNewYear(test);
      tests.push(newYear);
    }

    this.createNewYear = function(test){
      return {
        year:test.year,
        yearsTests:ko.observableArray([test])
      }
    }

    this.formatRemotePaths = function(sortedTests){
      var tests = sortedTests;
      var serverURL = this.remote.getServerURL();
      for(var i = 0; i < tests.length; i++){
        var forThisYear = tests[i].yearsTests();
        for(var j = 0; j < forThisYear.length; j++){
          forThisYear[j].file_url = serverURL + '/tests/' + forThisYear[j].file_url;
        }
      }
    }

    this.onRetrievalError = function(error){
      console.log(error);
    }
    this.onRetrievalError = this.onRetrievalError.bind(this);



    this.openTestUploader = function(){
      this.isTestUploaderVisible(true);
    }

    this.closeTestUploader = function(){
      this.isTestUploaderVisible(false);
    }
    this.closeTestUploader = this.closeTestUploader.bind(this);

    this.getTestData = function(event){
      var $form = $(event.target.form);
      var testName = $form.find("input[type='radio']:checked").val();
      var withSolutions = $form.find("input[type='checkbox']:checked").val();
      if(withSolutions){
        testName += ' with Solutions';
      }
      else{
        testName += ' without Solutions';
      }
      var year = Number($form.find("input[type='number']").val());
      var files = $form.find("input[type='file']")[0].files;
      return {
        files:files,
        year:year,
        testName:testName
      }
    }

    this.uploadTest = function(data, event, callback){
      var data = this.getTestData(event);
      var filesToUpload = data.files;
      var year = data.year;
      var testName = data.testName;

      if (filesToUpload && filesToUpload[0]) {
          var file = filesToUpload[0];
          var reader = new FileReader();
          var groupId = this.store.getGroupInfo().getId();
          var self = this;
          reader.onload = function(e){
            var encodedFile = e.target.result;
            self.remote.saveFile(encodedFile, groupId, testName, year);
            if(callback && typeof callback == 'function'){
              callback();
            }
          }
          reader.readAsDataURL(file);
      }
      else{
        throw new Error('File does not exist.');
      }
    }


    this.deleteTest = function(data, event){
      var testId = data.test_id;
      this.remote.deleteTest(testId);
    }
    this.deleteTest = this.deleteTest.bind(this);



    this.onTestCollectionChanged = function(){
      var groupId = this.store.getGroupInfo().getId();
      this.remote.getPractiseTests(groupId);
    }
    this.onTestCollectionChanged = this.onTestCollectionChanged.bind(this);

    this.onTestUploadError = function(a,b,err){
      console.log(a.responseText);
    }



}; // end view model.

  return {
    viewModel: PracticeTestsViewModel,
    template: template
  }
});


define('text!non-member-prompt/template.html',[],function () { return '<link rel="stylesheet"\n      href="./styles/components/course/prompts/non-member.css">\n\n  <div\n      id="course-joined-message"\n      data-bind="visible:showCourseJoinedMessage()">\n    <span>You have joined!</span>\n    <span id="ok-sign">\n      &#10003;\n    </span>\n  </div>\n\n\n<div id="membership-prompt-holder"\n      data-bind="visible:isVisible()">\n\n  <!-- spinner -->\n  <div  class="screen-center-outer">\n   <div class="screen-center-inner">\n      <div class="loader"\n           data-bind="visible:isSpinnerVisible()">\n      </div>\n   </div>\n </div>\n\n  <div data-bind="text:joinPromptMessage(),\n                  visible:userHasPhoto() == false">\n  </div>\n\n  <div data-bind="visible:userHasPhoto() == false">\n       <img id=\'empty-photo-button\'\n            data-bind="click:showProfileSetter, attr:{src:profilePhotoURL}"\n            src="#">\n        </img>\n  </div>\n\n\n  <button id="join-class-button"\n           data-bind="disable: userHasPhoto() == false, click:joinCourse">\n    Join\n  </button>\n\n  <div id="thank-you-message"\n       data-bind="visible: isThankYouMessageVisible()">\n    <div>Thank you!</div>\n    <div>Now you are free</div>\n    <div>to join. &#128513;</div>\n  </div>\n\n</div>\n';});

define('non-member-prompt/Component',['ko',
'text!non-member-prompt/template.html',
'dispatcher/Dispatcher',
'course/CourseStore'],
function(
  ko,
  template,
  Dispatcher,
  CourseStore){

  function MembershipPromptViewModel(){
    this.store = CourseStore;
    this.dis = new Dispatcher();
    this.isVisible = ko.observable(false);
    this.isSpinnerVisible = ko.observable(false);
    this.userHasPhoto = ko.observable(true);
    this.profilePhotoURL = './assets/no-photo.jpg';
    this.joinPromptMessage = ko.observable('Upload your photo to join.');
    this.showCourseJoinedMessage = ko.observable(false);
    this.isThankYouMessageVisible = ko.observable(false);
    this.courseCode = ko.observable('');
    this.sectionLetter = ko.observable('');


    this.onStoreChange = function(){

      var isWaitingToJoin = this.store.isWaitingToJoin();
      if(isWaitingToJoin){
        this.showGroupJoined();
      }
      var grp = this.store.getGroupInfo();
      if(grp && !grp.isMember() && !grp.inAnotherSection()){
        this.isVisible(true);
        this.courseCode(grp.getCourseCode());
        this.sectionLetter(grp.getSectionLetter());
        this.userHasPhoto(this.store.userHasProfilePhoto() );
        if(this.store.showThankyouMessage()){
          // console.log('SHOWING THANK YOU!!!!');
          this.isThankYouMessageVisible(true);
          this.dis.dispatch('hideProfileSetter');
        }
      }
      else{
        this.isVisible(false);
      }
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.subscribe(this.onStoreChange);




    this.joinCourse = function(){
      if(!this.store.getCurrentGroup()){
        throw new Error('groupInfo has not been initialized yet.');
      }
      this.isSpinnerVisible(true);
      var grpId = this.store.getCurrentGroup().getId();
      this.isThankYouMessageVisible(false);
      this.dis.dispatch('joinCourse', grpId);
    }


    this.showGroupJoined = function(){
      this.isSpinnerVisible(false)
      this.showCourseJoinedMessage(true);
      this.isThankYouMessageVisible(false);
      var self = this;
      window.setTimeout(function(){
        self.showCourseJoinedMessage(false);
        self.isVisible(false);
      },2500);
    }
    this.showGroupJoined = this.showGroupJoined.bind(this);


    this.showProfileSetter = function(){
      this.dis.dispatch('showProfileSetter');
    }



}; // end view model.

  return {
    viewModel: MembershipPromptViewModel,
    template: template
  }
});


define('text!in-another-section-prompt/template.html',[],function () { return '<link rel="stylesheet" href="./styles/components/course/prompts/in-another-section.css">\n\n<div data-bind="visible:isVisible()" id=\'in-another-section-holder\'>\n     <div>\n              You are already in another section for\n          <span data-bind="text:dept() + courseCode()"></span>\n     </div>\n     <div id="another-section-switch">Switch to this section?</div>\n     <div>\n       <button data-bind="click:switchCourse">Yes</button>\n     </div>\n</div>\n';});

define('in-another-section-prompt/Component',['ko',
'text!in-another-section-prompt/template.html',
'dispatcher/Dispatcher',
'course/CourseStore'],
function(
  ko,
  template,
  Dispatcher,
  CourseStore){

  function InAnotherSectionViewModel(){
    this.store = CourseStore;
    this.dis = new Dispatcher();
    this.sectionLetter = ko.observable('');
    this.courseCode = ko.observable('');
    this.dept = ko.observable('');
    this.isVisible = ko.observable(false);

    this.onStoreChange = function(){
      var grp = this.store.getCurrentGroup();
      var isVisible = grp && !grp.isMember() && grp.inAnotherSection();
      this.isVisible(isVisible);
      if(isVisible){
        this.sectionLetter(grp.getSectionLetter());
        this.dept(grp.getDept());
        this.courseCode(grp.getCourseCode());
      }
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.subscribe(this.onStoreChange);



    this.switchCourse = function(){
      var grp = this.store.getCurrentGroup();
      this.dis.dispatch('switchToCourseGroup', grp);
    }



}; // end view model.

  return {
    viewModel: InAnotherSectionViewModel,
    template: template
  }
});


define('text!chat/template.html',[],function () { return '<link rel="stylesheet" href="./styles/components/chat/style.css?v=2.3"></link>\n\n<div id="chat-holder"\n     data-bind="visible:isVisible()">\n     <!-- spinner -->\n     <div  class="screen-center-outer">\n      <div class="screen-center-inner">\n         <div class="loader"\n              data-bind="visible:isSpinnerVisible()">\n         </div>\n      </div>\n    </div>\n\n  <ul class="show-vert-scroll"\n      data-bind="foreach: messages"\n      id="chat">\n\n      <li class="chat-message"\n          draggable="false"\n          data-bind="css:{ \'chat-message-self\': owner == true}">\n\n        <!-- ko if: typeof img_url == \'string\' -->\n          <img data-bind="attr:{src:img_url}"\n               class="one-on-one-chat-img disable-select">\n          </img>\n        <!-- /ko -->\n\n        <span data-bind="html:getHTML()"\n              class="chat-text">\n        </span>\n\n        <!-- ko if: owner -->\n        <i data-toggle="tooltip" title="sending">\n          <i class="dot acknowledgement-dot empty-dot sent-dot"\n           data-bind="visible:!sent()">\n         </i>\n        </i>\n        <i data-toggle="tooltip" title="sent">\n          <i class="dot acknowledgement-dot filled-dot sent-dot"\n             data-bind="visible:sent()">\n          </i>\n        </i>\n        <i data-toggle="tooltip" title="seen">\n          <i class="dot acknowledgement-dot filled-dot seen-dot"\n             data-bind="visible:seen()">\n          </i>\n        </i>\n        <i class="dot acknowledgement-dot empty-dot seen-dot"\n           data-bind="visible:!seen()">\n        </i>\n        <!-- /ko -->\n\n        <span data-bind="text:timestamp, css: { \'chat-timestamp-other-person\': owner != true }"\n              class="chat-timestamp disable-select">\n        </span>\n\n        <i class="sender-img-holder"\n          data-bind="visible: owner == true">\n          <img class="sender-img"\n              data-bind="attr:{src:getSenderImageURL()}">\n        </img>\n        </i>\n\n        <i class="sender-img-holder-other"\n          data-bind="visible: owner == false">\n          <img class="sender-img"\n              data-bind="attr:{src:getSenderImageURL()}">\n        </img>\n        </i>\n\n      </li>\n  </ul>\n\n\n\n\n  <div id="message-sender">\n\n    <div data-bind="visible:friendTyping()"\n          id="typing-message-pos">\n      <div class="horz-loader">Loading...</div>\n      <i id="typing-message">Typing..</i>\n    </div>\n\n<!-- New friend message prompt. -->\n    <div id="send-msg-prompt"\n         data-bind="visible:showSendMsgPrompt()">\n\n        <span id="send-message-prompt-text"\n              class="disable-select">\n\n            Say hello!\n                <i class="down"\n                   id="send-message-prompt-down-arrow">\n                </i>\n          </span>\n    </div>\n\n    <textarea id="message-input-holder"\n              class="show-vert-scroll"\n               placeholder="What would you like to say to them?"\n               type="text"\n               data-bind="textInput:newMessage,\n                          event:{keydown: onKeyPress}\n                          attr: {placeholder:placeholder()},\n                          hasFocus: inputHasFocus(),\n                          click: inputClicked">\n    </textarea>\n\n    <button id="send-message-btn"\n            class="disable-select"\n            data-bind="enable:isValidInput(), click:send, css:{}">\n            SEND\n    </button>\n  </div>\n</div>\n';});

define('chat/models/ChatMessage',['ko'],
function(ko){
    var ChatMessage = function(data, host){

      this.sent = ko.observable(false);
      this.seen = ko.observable(false);


      this.getConstructorName = function(){
        return "ChatMessage";
      }

      this.setHost = function(host){
        if(typeof host != 'string' || host.lenth < 1)
          throw new Error('host must be set')
        this.host = host
      }
      this.setHost(host)

      this.setId = function(message_id){
        if(!message_id || typeof message_id != 'number'){
          throw new Error('message_id must be specified.');
        }
        this.message_id = message_id;
      }

      this.getId = function(){
        return this.message_id;
      }

      this.setText = function(text){
        if(!text || typeof text != 'string'){
          throw new Error('text property must exist in the message.');
        }
        this.text = text;
      }
      this.setText(data.text);

      this.setSenderImgURL = function(url){
        if(typeof url != 'string' || url.length < 1){
          throw new Error('senders img url required')
        }
        this.imgURL = url
      }
      this.setSenderImgURL(data.small_photo_url)

      this.getSenderImageURL = function(){
        return this.host + '/' + this.imgURL
      }

      this.getSenderId = function(){

      }

      this.isOwner = function(){

      }

    } // end constructor


    ChatMessage.getRaw = function(user_id){
      var raw = {
        timestamp: "2019-04-09T05:42:56.000Z",
        message_id: 3,
        recipient_id: 2,
        user_id:1,
        text:'default text',
        small_photo_url:'img.jpg'
      };

      if(user_id){
        raw.user_id = user_id;
        return raw
      }
      else{
        return raw;
      }
    }

    ChatMessage.getFake = function(){
      var raw = ChatMessage.getRaw();
      var host = 'fakehost'
      return new ChatMessage(raw, host);
    }

    return ChatMessage;
});

define('chat/models/OutboundChatMessage',['ko','chat/models/ChatMessage','text-utilities'],
function(ko,ChatMessage, TextUtilities){
    var OutboundChatMessage = function(raw, host){
    Object.setPrototypeOf(this, new ChatMessage(raw ,host));

    this.owner = true;
    this.token = Date.now();

    this.getConstructorName = function(){
      return "OutboundChatMessage";
    }

    this.setRecipientId = function(id){
      if(!id || Number.isInteger(id) == false){
        throw new Error('recipient_id must be a integer.');
      }
      this.recipient_id = id;
    }
    this.setRecipientId(raw.recipient_id);

    this.setSent = function(token){
      token == this.token ? this.sent(true) : null;
    }

    this.setSeen = function(messageId){
      messageId == this.getId() ? this.seen(true) : null;
    }

    /**
      Overrides
    */
    this.getHTML = function(){
      return TextUtilities.wrapLinks(this.text, 'chat-link');
    }

    this.getToken = function(){
      return this.token;
    }
  } // end constructor

  OutboundChatMessage.constructor = OutboundChatMessage;

  OutboundChatMessage.getFake = function(){
    var raw = ChatMessage.getRaw()
    raw.recipient_id = 1
    return new OutboundChatMessage(raw,'host');
  }
    return OutboundChatMessage;
});

define('chat/models/InboundChatMessage',['chat/models/ChatMessage',
        'text-utilities'],
function(ChatMessage,
         TextUtilities){
    var InboundChatMessage = function(raw, host){

    Object.setPrototypeOf(this, new ChatMessage(raw, host));

    this.setId(raw.message_id);
    this.sent(true);

    this.setSeen = function(seen){
      if(seen != 1 && seen != 0){
        throw new Error('seen must be 1 or 0');
      }
      this.seen(seen);
    }
    this.setSeen(raw.seen);

    this.setSenderId = function(id){
        if(!id || typeof id != 'number'){
          throw new Error('user_id must be set on each message.');
        }
      this.user_id = id;
    }
    this.setSenderId(raw.user_id);


    this.getSenderId = function(){
      return this.user_id;
    }

    this.setRecipientId = function(id){
      if(!id || typeof id != 'number'){
        throw new Error('recipient_id must be set on each message.');
      }
      this.recipient_id = id;
    }
    this.setRecipientId(raw.recipient_id);


    this.setTimestamp = function(time){
      if(typeof time != 'string' || time.length < 1){
        throw new Error('timestamp must exist.');
      }
      this.timestamp = time;
    }
    this.setTimestamp(raw.timestamp);

    this.isSent = function(){
      return false;
    }

    this.maybeSetAsOwner = function(owner){
      if(owner && owner != 'recipient'){
        this.owner = true;
      }
      else{
        this.owner = false;
      }
    }
    this.maybeSetAsOwner(raw.owner);


    this.isOwner = function(){
      return this.owner === true;
    }

    this.setStyleClass = function(styleClass){
      this.styleClass = styleClass;
    }

    /**
      To be used in a html binding in  knockoutjs.
    */
    this.getHTML = function(){
      if(!this.isOwner()){
        return TextUtilities.wrapLinks(this.text, 'chat-link-friend');
      }
      else{
        return TextUtilities.wrapLinks(this.text, 'chat-link');
      }
    }



  } // end constructor

  InboundChatMessage.getRaw = function(){
    var raw = ChatMessage.getRaw()
    var obj = Object.assign(raw,{
      message_id:1,
      user_id:2,
      recipient_id:3,
      text:'hello',
      timestamp:'moments ago',
      seen:0
    })
    console.log(obj)
    return obj
  }

  InboundChatMessage.getFake = function(){
    var raw = InboundChatMessage.getRaw()
    var host = 'host'
    return new InboundChatMessage(raw, host);
  }
  return InboundChatMessage;
});

define('chat/ChatRemoteService',['socketio',
        'ActiveRemoteService',
        'dispatcher/Dispatcher',
        'chat/models/InboundChatMessage'],
function(io,
         ActiveRemoteService,
         Dispatcher,
         InboundChatMessage){

var ChatRemoteService = function(){

    this.constructor = ChatRemoteService;
    this.sock = null;
    this.io = io;
    this.dis = new Dispatcher();
    Object.setPrototypeOf(this, new ActiveRemoteService());
    this.setMicroServer("chat");


    this.onAuth = function(change){
      if(change.state == 'authenticated'){
        this.setSock(this.onSock);
      }
    }
    this.onAuth = this.onAuth.bind(this);
    this.disAuthId = this.dis.reg('authState', this.onAuth);


    this.onSock = function(){
      this.sock.on('io_error',this.onError);
      this.sock.on('messageSent', this.onMessageSent);
      this.sock.on('chatHistory',this.onMessageHistory);
      this.sock.on('friendTyping',this.onTyping);
      this.sock.on('message', this.onMessage);
      this.sock.on('seen', this.onSeen);
    }
    this.onSock = this.onSock.bind(this);


    this.onError = function(err){
      console.log(err);
    }

    this.onMessageHistory = function(raw){
      var collection = [];
      var host = this.getServerURL()
      raw.forEach(function(e){
        collection.push(new InboundChatMessage(e,host));
      })
      this.dis.dispatch('chatHistory', collection);
    }
    this.onMessageHistory = this.onMessageHistory.bind(this);

    this.onMessage = function(raw){
      var host = this.getServerURL()
      this.dis.dispatch('message', new InboundChatMessage(raw, host));
    }
    this.onMessage = this.onMessage.bind(this);

    this.onMessageSent = function(acknowledgement){
      this.dis.dispatch('messageSent', acknowledgement);
    }
    this.onMessageSent = this.onMessageSent.bind(this);


    this.onSeen = function(messageIds){
      if(!Array.isArray(messageIds)){
        throw new Error('messageIds must be an array.')
      }
      else if(messageIds.length > 0){
        this.dis.dispatch('seen',messageIds);
      }
    }
    this.onSeen = this.onSeen.bind(this);


    this.emitGetHistory = function(classmateId){
      this.sock.emit('getChatHistory',classmateId);
    }
    this.emitGetHistory = this.emitGetHistory.bind(this);
    this.histId = this.dis.reg('getChatHistory', this.emitGetHistory);


    this.emitSeen = function(m){
      this.sock.emit('messageSeen', m);
    }
    this.emitSeen = this.emitSeen.bind(this);
    this.seenId = this.dis.reg('messageSeen', this.emitSeen);


    this.emitMessage = function(m){
      this.sock.emit('sendMessage', m);
    }
    this.emitMessage = this.emitMessage.bind(this);
    this.sendMessageId = this.dis.reg('sendMessage',this.emitMessage);

    this.emitTyping = function(classmatesTyping){
      this.sock.emit('typing',classmatesTyping);
    }
    this.emitTyping = this.emitTyping.bind(this);
    this.typingId = this.dis.reg('typing',this.emitTyping);

    this.onTyping = function(classmateId){
      this.dis.dispatch('friendTyping',classmateId);
    }
    this.onTyping = this.onTyping.bind(this);

}

return ChatRemoteService;
})
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */

define('chat/ViewModel',['ko',
        'socketio',
        'text-utilities',
        'text!chat/template.html',
        'chat/models/ChatMessage',
        'chat/models/OutboundChatMessage',
        'chat/ChatRemoteService',
        'dispatcher/Dispatcher'],

function(ko,
         io,
         TextUtilities,
         template,
         ChatMessage,
         OutboundChatMessage,
         ChatRemoteService,
         Dispatcher){


  function ViewModel(params,componentInfo){

    this.dis = new Dispatcher();
    this.selectedClassmateId = ko.observable(null);
    this.inputHasFocus = ko.observable(false).extend({notify: 'always'});
    this.placeholder = ko.observable('');
    this.messages = ko.observableArray([]);
    this.showSendMsgPrompt = ko.observable(false);
    this.newMessage = ko.observable('');
    this.isValidInput = ko.observable(false);
    this.isSpinnerVisible = ko.observable(false);
    this.friendTyping = ko.observable(false);
    this.remoteService = new ChatRemoteService();
    this._messageSentHideDelay = 5000;


    this.onClassmateSelected = function(classmate){
      if(!classmate || typeof classmate != 'object'){
        throw new Error('Classmate must be an object.');
      }
      this.selectedClassmateId(classmate.getId());
      this.refreshChat();
    }
    this.onClassmateSelected = this.onClassmateSelected.bind(this);
    this.dis.reg('focusPerson',this.onClassmateSelected);

    this.isVisible = ko.computed(function(){
        return this.selectedClassmateId() > 0;
    },this);

    this.onKeyPress = function(vm, event){
      event.send = this.send;
      return TextUtilities.onKeyPress(event);
    }
    this.onKeyPress = this.onKeyPress.bind(this);

    this.validateTextInput = function(value){
      /[^\s]+/.test(value) ? this.isValidInput(true) : this.isValidInput(false);
    }
    this.validateTextInput = this.validateTextInput.bind(this);
    this.newMessage.subscribe(this.validateTextInput,this);

    this.recordPartialText = function(text){
      var classmateId = this.selectedClassmateId();
      if(isNaN(classmateId) || classmateId < 1){
        throw new Error('classmateId must be a postive integer.');
      }
      else if(typeof text == 'string' && text.length > 0){
        this.dis.dispatch('typing',{recipient_id: classmateId, text:text});
      }
    }
    this.recordPartialText = this.recordPartialText.bind(this);
    this.typingSub = this.newMessage.subscribe(this.recordPartialText,this);


    this.onOpenGroupView = function(){
      this.selectedClassmateId(null);
    }
    this.onOpenGroupView = this.onOpenGroupView.bind(this);
    this.dis.reg('showGroupView',this.onOpenGroupView);

    this.onMessageHistory = function(msgs){
      if(!Array.isArray(msgs)){
        throw new Error('msgs must be an array.');
      }
      this.isSpinnerVisible(false);
      if(msgs.length <= 0){
        this.attachSendMessagePrompt();
      }
      else{
        this.showSendMsgPrompt(false);
        for(var i = 0; i < msgs.length; i++){
          var classmateId = this.selectedClassmateId();
          var senderId = msgs[i].getSenderId();
          var owner = msgs[i].isOwner();
          if(classmateId == senderId || owner){
              this.messages.unshift(msgs[i]);
          }
        }
      }
    }
    this.onMessageHistory = this.onMessageHistory.bind(this);
    this.dis.reg('chatHistory', this.onMessageHistory);


    /**
     * Shows the "Send a message to X" prompt
     * because there currently is no chat
     * history for the given friend.
     */
    this.attachSendMessagePrompt = function(){
      this.showSendMsgPrompt(true);
    }
    this.attachSendMessagePrompt = this.attachSendMessagePrompt.bind(this);

    this.initialize = ko.computed(function(){
      var friendId = this.selectedClassmateId();
      return friendId;
    },this);

    this.clearChat = function(){
        this.messages([]);
        this.friendTyping(false);
    }

    this.updateTextInputPlaceHolder = function(classmate){
      this.placeholder("What would you like to say to " + classmate.getFirst() + "?");
    }
    this.updateTextInputPlaceHolder = this.updateTextInputPlaceHolder.bind(this);
    this.dis.reg('selectedClassmate', this.updateTextInputPlaceHolder);

    this.oldFriendId = null;

    this.refreshChat = function(){
        var friendId = this.selectedClassmateId();
        if(friendId < 1){
          return; // no friend selected.
        }
        if(this.oldFriendId){
          this.clearChat();
        }
        this.isSpinnerVisible(true);
        this.oldFriendId = friendId;
        this.newMessage('');
        this.dis.dispatch('getChatHistory',friendId)
        this.inputHasFocus(true);
    }
    this.refreshChat = this.refreshChat.bind(this);

    this.inputClicked = function(){
      this.inputHasFocus(true);
    }


    /**
     * adds the message to the display and sends it
        because there is a noticable lag before the
        server response. (sent!) gets shown when the serve responds.
     */
    this.send = function(){
      var r = this.selectedClassmateId();
      var text = TextUtilities.formatToHTML(this.newMessage());
      var host = this.remoteService.getServerURL()
      var obj = {
        text:text,
        small_photo_url:'img',
        recipient_id:r
      }
      var m = new OutboundChatMessage(obj,host);
      this.messages.unshift(m);
      m.text = Object.getPrototypeOf(m).text;
      this.dis.dispatch('sendMessage', m);
      this.newMessage('');
    }
    this.send = this.send.bind(this);



    /**
      Finds the matching message
      and set it to 'sent'.
    */
    this.onMessageSent = function(acknowledgement){
      var token = acknowledgement.token;
      this.messages().forEach(function(m){
        if(m.getConstructorName() == 'OutboundChatMessage' && token == m.getToken()){
            m.setSent(token);
            m.setId(acknowledgement.id);
        }
      })
      this.inputHasFocus(true);
    }
    this.onMessageSent = this.onMessageSent.bind(this);
    this.dis.reg('messageSent', this.onMessageSent);


    this.onMessagesSeen = function(messageIds){
      this.messages().forEach(function(m){
        if(m.getConstructorName() == 'OutboundChatMessage'){
          messageIds.forEach(function(id){
              m.setSeen(id);
          })
        }
      })
    }
    this.onMessagesSeen = this.onMessagesSeen.bind(this);
    this.seenId = this.dis.reg('seen', this.onMessagesSeen);


    this.onTyping = function(id){
      if(id == this.selectedClassmateId()){
        this.friendTyping(true);
        var self = this;
        if(self.onTypingId){
          clearTimeout(self.onTypingId);
        }
        self.onTypingId = setTimeout(function(){
          self.friendTyping(false);
        },3000);
      }
    }
    this.onTyping = this.onTyping.bind(this);
    this.dis.reg('friendTyping',this.onTyping);

    this.onMessage = function(message){
        var classmateId = this.selectedClassmateId();
        if(message.getSenderId() === classmateId){
          this.messages.unshift(message);
          this.showSendMsgPrompt(false);
          this.friendTyping(false);
          this.dis.dispatch('messageSeen', message);
        }
    }
    this.onMessage = this.onMessage.bind(this);
    this.disChatId = this.dis.reg('message', this.onMessage);

}; // end view model.

  return {
    viewModel: ViewModel,
    template: template
  }

});


define('text!right-panel/template.html',[],function () { return '\n\n    <course-info></course-info>\n    <pre-view></pre-view>\n    <person-info></person-info>\n    <file-dropper></file-dropper>\n';});

define('right-panel/Component',['ko', 'text!right-panel/template.html',],
function(ko, template){
  var ViewModel = function(){};
  return {
    viewModel:ViewModel,
    template: template
  }
});

define('ad-views/AdRemoteService',['ActiveRemoteService',
        'socketio',
        'dispatcher/Dispatcher',
        'jquery'],
function(ActiveRemoteService,
         io,
         Dispatcher,
         $){


  var AdRemoteService = function(data){
    this._io = io;
    this.dis = new Dispatcher();
    this.constructor = AdRemoteService;
    Object.setPrototypeOf(this, new ActiveRemoteService());
    this.setMicroServer("ads");


    this.registerOnAdReceived = function(fn){
      this.checkFunction(fn);
      this.onAdReceived = fn;
    }

    this.getAdFromServer = function(){
      var url = this.getServerURL() + '/ad';
      var self = this;
      $.ajax({
        url:url,
        type:'GET',
        beforeSend:this.setAuthorizationHeader,
        success:function(json){
          self.onAdReceived(JSON.parse(json));
        },
        error:function(a,b,err){
          console.log(err);
        }
      });
    }


    this.registerOnMessageSent = function(fn){
      this.checkFunction(fn);
      this.onMessageSent = fn;
    }



    this.onAdHovered = function(ad){
      var url = this.getServerURL() + '/adHovered';
      $.ajax({
        url:url,
        type:'POST',
        data:{adId:ad.getId()},
        beforeSend:this.setAuthorizationHeader,
        error:function(a,b,err){
          console.log(err);
        }
      });
    }
    this.onAdHovered = this.onAdHovered.bind(this);
    this.adHoveredId = this.dis.reg('adHovered', this.onAdHovered);



    this.recordLeadClick = function(ad){
      var url = this.getServerURL() + '/adClicked';
      $.ajax({
        url:url,
        type:'POST',
        data:{adId:ad.getId()},
        beforeSend:this.setAuthorizationHeader,
        error:function(a,b,err){
          console.log(err);
        }
      });
    }


    this.sendMessage = function(adMsgPair){
      var url = this.getServerURL() + '/message';
      var ad = adMsgPair.ad;
      var msg = adMsgPair.message;
      $.ajax({
        url:url,
        type:'POST',
        data:{
          adId:ad.getId(),
          message:msg,
          headline:ad.getHeadline()
        },
        beforeSend:this.setAuthorizationHeader,
        success:this.onMessageSent,
        error:function(a,b,err){
          console.log(err);
        }
      });
    }


    this.checkFunction = function(fn){
      if(typeof fn != 'function'){
        throw new Error('fn must be a function');
      }
    }

  } // end constructor.

  return AdRemoteService;

})
;

define('ad-views/NullAd',['ko'],
function(ko){

  var NullAd = function(data){
    this.getConstructorName = function(){
      return "NullAd";
    }

    this.id = 0;
    this.headline = "Your Headline";
    this.degree = "B.A";
    this.school = "York University";
    this.major = "Computer Science";
    this.experience = 2;
    this.firstName = "First";
    this.lastName = "Last";
    this.imgURL = './assets/no-photo.jpg';
    this.hourlyRate = 25;
    this.isDegreeVerified = true;

    this.getId = function(){
      return this.id;
    }

    this.getHeadline = function(){
      return this.headline;
    }

    this.getDegree = function(){
      return this.degree;
    }


    this.getSchool = function(){
      return this.school;
    }


    this.getMajor = function(){
      return this.major;
    }

    this.getExperience = function(){
      return this.experience;
    }


    this.getFirstName = function(){
      return this.firstName;
    }

    this.getLastName = function(){
      return this.lastName;
    }

    this.getImgURL = function(){
      return this.imgURL;
    }


    this.getHourlyRate = function(){
      return this.hourlyRate;
    }


    this.isDegreeVerified = function(){
      return this.isDegreeVerified;
    }

    this.getText = function(){
      return '';
    }

  } // end constructor.

  return NullAd;

})
;

define('ad-views/Ad',['ko'],
function(ko){

  var Ad = function(data){


    this.getConstructorName = function(){
      return "Ad";
    }

    this.checkString = function(str, errMsg){
      if(!str || typeof str != 'string' || str.length < 1){
        throw new Error(errMsg);
      }
    }

    this.checkNum = function(num, errMsg){
      if(!num || Number.isInteger(num) == false || num < 1){
        throw new Error(errMsg);
      }
    }


    this.setId = function(id){
      this.checkNum(id, 'ad_id required');
      this.ad_id = id;
    }
    this.setId(data.ad_id);

    this.getId = function(){
      return this.ad_id;
    }


    this.setHeadline = function(headline){
      this.checkString(headline,'headline is required.');
      this.headline = headline;
    }
    this.setHeadline(data.headline);

    this.getHeadline = function(){
      return this.headline;
    }

    this.setDegree = function(degree){
      this.checkString(degree, 'degree is required.');
      this.degree = degree;
    }
    this.setDegree(data.degree);


    this.getDegree = function(){
      return this.degree;
    }

    this.setSchool = function(school){
      this.checkString(school, 'school is required.');
      this.school = school;
    }
    this.setSchool(data.school);


    this.getSchool = function(){
      return this.school;
    }

    this.setMajor = function(major){
      this.checkString(major, 'major is required.');
      this.major = major;
    }
    this.setMajor(data.major);


    this.getMajor = function(){
      return this.major;
    }

    this.setExperience = function(exp){
      this.checkNum(exp, 'experience is required.');
      this.experience = exp;
    }
    this.setExperience(data.experience);


    this.getExperience = function(){
      return this.experience + " years";
    }


    this.setFirstName = function(name){
      this.checkString(name, 'first_name is is required.');
      this.firstName = name;
    }
    this.setFirstName(data.first_name);


    this.getFirstName = function(){
      return this.firstName;
    }


    this.setLastName = function(name){
      this.checkString(name, 'last_name is is required.');
      this.lastName = name;
    }
    this.setLastName(data.last_name);


    this.getLastName = function(){
      return this.lastName;
    }

    this.setImgURL = function(url){
      this.checkString(url, 'img_url is is required.');
      this.imgURL = url;
    }
    this.setImgURL(data.img_url);

    this.getImgURL = function(){
      return this.serverPrefix + '/' + this.imgURL;
    }

    this.setServerPrefix = function(host){
      this.checkString(host);
      this.serverPrefix = host;
    }

    this.setHourlyRate = function(rate){
      this.checkNum(rate, 'hourly_rate is required.');
      this.hourlyRate = rate;
    }
    this.setHourlyRate(data.hourly_rate);

    this.getHourlyRate = function(){
      return this.hourlyRate;
    }

    this.setDegreeVerification = function(isVerified){
      if(isVerified != 0 && isVerified != 1){
        throw new Error('is_degree_verified is required.');
      }
      this.isDegreeVerified = isVerified;
    }
    this.setDegreeVerification(data.is_degree_verified);


    this.isDegreeVerified = function(){
      return this.isDegreeVerified;
    }

    this.setText = function(text){
      if(!text || typeof text != 'string' || text.length < 1){
        throw new Error('Ads must have non-empty text.');
      }
      this.text = text;
    }
    this.setText(data.text);


    this.getText = function(){
      return this.text;
    }

  } // end constructor.

  return Ad;

})
;
define('ad-views/AdStore',['ko',
         'ad-views/AdRemoteService',
         'dispatcher/Dispatcher',
         'ad-views/NullAd',
         'ad-views/Ad'],
function(
  ko,
  RemoteService,
  Dispatcher,
  NullAd,
  Ad
){


  var Store = {};
  var _currentAd = new NullAd();
  var _subscribers = [];

  var _remoteService = new RemoteService();
  var _isWaiting = false;
  var _dis = new Dispatcher();
  var _isAdVisible = true;
  var _isLeadOpen = false;
  var _leadMessage = 'Hi, I’m interested. Please contact me.';
  var _onPub = null;


  var _publish = function(){
    _subscribers.forEach(function(e){
      e();
    })
    if(typeof _onPub == 'function'){
      _onPub();
    }
  }

  Store.onPub = function(fn){
    _onPub = fn;
  }

  Store.getCurrentAd = function(){
    return _currentAd;
  }

  Store.setCurrentAd = function(ad){
    if(ad.getConstructorName() != 'Ad'){
      throw new Error('error');
    }
    _currentAd = ad;
  }


  Store.isAdVisible = function(){
    return _isAdVisible;
  }

  Store.setAdVisible = function(){
    _isAdVisible = true;
  }

  Store.setAdNotVisible = function(){
    _isAdVisible = false;
  }

  Store.onOpenGroupView = function(){
     Store.setAdVisible();
    _publish();
  }
  _dis.reg('showGroupView',Store.onOpenGroupView);



  Store.onGiveClassmateFocus = function(){
    Store.setAdNotVisible();
    _publish();
  }
  Store.classmateId = _dis.reg('focusPerson', Store.onGiveClassmateFocus);


  Store.init = function(){
    _remoteService.registerOnAdReceived(Store.onAdReceived);
    _remoteService.registerOnMessageSent(Store.onMessageSent);
  }

  Store.onAdReceived = function(rawAd){
    _currentAd = new Ad(rawAd);
    _currentAd.setServerPrefix(_remoteService.getServerURL());
    Store.publish();
  }

  Store.onMessageSent = function(){
    _isWaiting = false;
    Store.publish();
  }

  Store.getLeadMessage = function(){
    return _leadMessage;
  }

  Store.onCourseInfo = function(groupInfo){
    _remoteService.getAdFromServer();
  }
  _dis.reg('groupInfo', Store.onCourseInfo);

  Store.isWaiting = function(){
    return _isWaiting;
  }

  Store.isLeadOpen = function(){
    return _isLeadOpen;
  }

  Store.onOpenLead = function(){
    _isLeadOpen = true;
    Store.publish();
    _remoteService.recordLeadClick(_currentAd);
  }
  _dis.reg('openLead', Store.onOpenLead);


  Store.onCloseLead = function(){
    _isLeadOpen = false;
    Store.publish();
  }
  _dis.reg('closeLead', Store.onCloseLead);

  Store.onMessage = function(msg){
    _remoteService.sendMessage({
      ad:_currentAd,
      message:msg
    });
    _isWaiting = true;
    Store.publish();
  }
  _dis.reg('leadMessage', Store.onMessage);

  Store.subscribe = function(fn){
    _subscribers.push(fn);
  }

  Store.publish = function(){
    _subscribers.forEach(function(fn){
      fn();
    })
    if(typeof _onPub == 'function'){
      _onPub();
    }
  }

  Store.getRemoteService = function(){
    return _remoteService;
  }

  Store.init();
  return Store;
});


define('text!ad-views/pre-view/template.html',[],function () { return '<link rel="stylesheet"\n      href="./styles/components/right-panel/ad-views/pre-view.css">\n  <div id=\'ad-views-holder\'\n       data-bind="visible:isVisible(),click:openLead,  event: { mouseenter: onHover}">\n       <div id="inner-ad-holder">\n         <img id="ad-image"\n              data-bind="attr:{\'src\':currentAd().getImgURL()}">\n         </img>\n         <div id="preview-bottom-part">\n           <div id="preview-footer"\n                data-bind="text:currentAd().getHeadline()">\n           </div>\n         </div>\n       </div>\n\n\n  </div>\n';});

define('right-panel/ad-views/pre-view/Component',['ko',
        'dispatcher/Dispatcher',
        'ad-views/AdStore',
        'text!ad-views/pre-view/template.html',
         'ad-views/NullAd'],
function(
  ko,
  Dispatcher,
  AdStore,
  template,
  NullAd){

  var ViewModel = function(){
    this.dis = new Dispatcher();
    this.isVisible = ko.observable(false);
    this.isLeadVisible = ko.observable(false).extend({notify:'always'});
    this.currentAd = ko.observable(new NullAd());
    this.store = AdStore;

    this.onStoreChange = function(){
      this.isVisible(this.store.isAdVisible());
      this.currentAd(this.store.getCurrentAd());
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.subscribe(this.onStoreChange);


    this.openLead = function(){
      this.dis.dispatch('openLead');
    }


    this.onHover = function(){
      this.dis.dispatch('adHovered',this.currentAd());
    }
    this.onHover = this.onHover.bind(this);


}; // end view model.

  return {
    viewModel:ViewModel,
    template: template
  }
});


define('text!ad-views/lead-view/template.html',[],function () { return '\n<link rel="stylesheet"\n      href="./styles/components/right-panel/ad-views/lead-view.css">\n\n<div id="lead-submitter" data-bind="visible: isVisible()">\n  <div id="ad-waiting"\n       class="loader"\n       data-bind="visible:isWaiting()">\n  </div>\n\n  <div id="message-sent" data-bind="visible:showMessageSent()">\n      Message Sent!\n  </div>\n\n  <!-- ko if: currentAd() != null -->\n  <div id="submitter-window" data-bind="click : closeLead">\n\n    <div>\n\n      <div id="ad-space" data-bind="click: dontPropagate">\n         <div id="ad-headline" data-bind="text:currentAd().getHeadline()"></div>\n         <!-- top row -->\n            <div id="ad-header-holder">\n\n              <img id="tutor-image"\n                   data-bind="attr:{src : currentAd().getImgURL()}">\n              </img>\n\n              <ul id=\'qualifications-list\'>\n                <li>\n                   <span> School</span> <span class="qual-data" data-bind="text:currentAd().getSchool()"></span>\n                </li>\n                <li>\n                   <span> Degree </span> <span class="qual-data"  data-bind="text:currentAd().getDegree()"></span>\n                </li>\n                <li>\n                   <span> Major </span><span class="qual-data"  data-bind="text:currentAd().getMajor()"></span>\n                </li>\n                <li>\n                   Experience <span  class="qual-data" data-bind="text:currentAd().getExperience()"></span>\n                </li>\n              </ul>\n\n            </div>\n         <div id="ad-text" data-bind="html:currentAd().getText()"></div>\n      </div>\n\n\n\n\n      <div id="ad-right-side" data-bind="click: dontPropagate">\n        <div id="lead-submition-space">\n          <div id="advertiser-name"> Contact\n            <span data-bind="text:currentAd().getFirstName()"></span>\n            <span data-bind="text:currentAd().getLastName()"></span>\n          </div>\n          <textarea id="submitter-text-area"\n                    data-bind="value:leadMessage">\n          </textarea>\n          <button id="submitter-message-button"\n                  data-bind="click:sendMessage">Send Message</button>\n        </div>\n\n      </div>\n\n    </div>\n\n\n\n  </div>\n <!-- /ko -->\n\n\n</div>\n';});

define('right-panel/ad-views/lead-view/Component',['ko',
        'dispatcher/Dispatcher',
        'text!ad-views/lead-view/template.html',
         'ad-views/AdStore',
         'ad-views/NullAd'],
function(
  ko,
  Dispatcher,
  template,
  AdStore,
  NullAd){

  var ViewModel = function(){
    this.isVisible = ko.observable(false);
    this.leadMessage = ko.observable('Hi, I’m interested. Please contact me.');
    this.isWaiting = ko.observable(false);
    this.currentAd = ko.observable(new NullAd());
    this.showMessageSent = ko.observable(false);
    this.store = AdStore;
    this.dis = new Dispatcher();



    this.onStoreChanged = function(){
      this.currentAd(this.store.getCurrentAd());
      this.isVisible(this.store.isLeadOpen());
      var wasWaiting = this.isWaiting();
      var isWaiting = this.store.isWaiting();
      if(wasWaiting && !isWaiting){
          this.leadMessage(this.store.getLeadMessage());
          this.showMessageSent(true);
          var self = this;
          setTimeout(function(){
            self.showMessageSent(false);
            self.isVisible(false);
          },1500);
      }
      this.isWaiting(isWaiting);
    }
    this.onStoreChanged = this.onStoreChanged.bind(this);
    this.store.subscribe(this.onStoreChanged);

    /**
      Stops the click event from propagating up to
      the window holder,  this is so the window
      does not close.
      */
    this.dontPropagate = function(a, event){
      event.stopImmediatePropagation();
    }


    this.closeLead = function(e, a){
      this.dis.dispatch('closeLead');
    }
    this.closeLead = this.closeLead.bind(this);


    this.sendMessage = function(){
      var message = this.leadMessage().trim();
      if(message.length > 0){
        this.dis.dispatch('leadMessage', message);
        this.leadMessage('');
      }
      else{
        alert('Messages can\'t be empty');
      }
    }
    this.sendMessage = this.sendMessage.bind(this);

}; // end view model.

  return {
    viewModel:ViewModel,
    template: template
  }
});


define('text!right-panel/current-courses/template.html',[],function () { return '\n<link rel="stylesheet" href="./styles/components/right-panel/current-courses.css">\n\n<div id="current-courses-holder"\n     data-bind="visible:isVisible()">\n\n  <div data-bind="visible:isConciseVisible()">\n    <span data-bind="visible:verboseCourses().length > 0">\n      Courses:\n      <span data-bind="foreach:conciseCourses()">\n        <span class="current-course"\n              data-bind="text:getDept() + getCourseCode() + getSectionLetter(), click:$parent.selectCourse">\n        </span>\n      </span>\n    </span>\n     <span data-bind="visible:verboseCourses().length > 3, click:showVerboseList"\n           class="current-course">more</span>\n  </div>\n\n\n  <div data-bind="visible:isVerboseVisible()">\n    <span data-bind="visible:verboseCourses().length > 0">\n      Courses:\n      <span data-bind="foreach:verboseCourses()">\n        <span class="current-course"\n              data-bind="text:getDept() + getCourseCode() + getSectionLetter(), click:$parent.selectCourse">\n        </span>\n      </span>\n    </span>\n    <span data-bind="visible:isVerboseVisible(), click:hideVerboseList"\n          class="current-course">less</span>\n  </div>\n\n\n</div> <!--end holder  -->\n';});

define('right-panel/current-courses/Component',[
'ko',
'text!right-panel/current-courses/template.html',
'dispatcher/Dispatcher',
'course/models/CourseGroup',
'course/CourseStore'], function(
  ko,
  template,
  Dispatcher,
  CourseGroup,
  CourseStore){

  var ViewModel = function(){

    this.dis = new Dispatcher();
    this.store = CourseStore;
    this.isVisible = ko.observable(false);

    this.isVerboseVisible = ko.observable(false);
    this.verboseCourses = ko.observableArray([]);

    this.isConciseVisible = ko.observable(true);
    this.conciseCourses = ko.observableArray([]);

    this.onStoreUpdate = function(){
      this.maybeSetExperimentalMode();
      var grps = this.store.getClassmateCourseGroups();
      this.verboseCourses(grps);
      var MAX_CONCISE_COURSES = 3;
      var concise = grps.slice(0, MAX_CONCISE_COURSES);
      this.conciseCourses(concise);
    }
    this.onStoreUpdate = this.onStoreUpdate.bind(this);
    this.store.subscribe(this.onStoreUpdate);


    this.maybeSetExperimentalMode = function(){
      var classmateId = this.store.getClassmatesId();

      if(Number.isInteger(classmateId)){
        if(classmateId % 2 == 0){
          this.isVisible(false);
        }
        else {
          this.isVisible(true);
        }
      }
    }


    this.selectCourse = function(grp){
      this.dis.dispatch('selectedGroupId', grp.getId());
    }
    this.selectCourse = this.selectCourse.bind(this);


    this.showVerboseList = function(){
      this.isVerboseVisible(true);
      this.isConciseVisible(false);
    }

    this.hideVerboseList = function(){
      this.isVerboseVisible(false);
      this.isConciseVisible(true);
    }




  }

  return {
    viewModel:ViewModel,
    template: template
  }

});


define('text!right-panel/course-info/template.html',[],function () { return '\n<link rel="stylesheet"\n      href="./styles/components/right-panel/course-info/course-info.css">\n\n<div id="course-info-holder"\n     data-bind="visible:isVisible()">\n     <course-photos></course-photos>\n     <course-text-info></course-text-info>\n</div>\n';});

define('right-panel/course-info/Component',[
'ko',
'text!right-panel/course-info/template.html',
'dispatcher/Dispatcher',
'course/CourseStore'],
function(
  ko,
  template,
  Dispatcher,
  Store){

  var ViewModel = function(){

    this.dis = new Dispatcher();
    this.store = Store;
    this.isVisible = ko.observable(false);

    this.onStoreChanged = function(){
      this.isVisible(this.store.isGroupViewVisible());
    }
    this.onStoreChanged = this.onStoreChanged.bind(this);
    this.store.subscribe(this.onStoreChanged);

}; // end view model.

  return {
    viewModel:ViewModel,
    template: template
  }
});


define('text!right-panel/course-info/text-info/template.html',[],function () { return '\n<link rel="stylesheet"\n      href="./styles/components/right-panel/course-info/text-info.css">\n\n<div id="course-text-info-holder">\n\n\n    <!-- ko if: group() != null -->\n\n  <div id="course-info-text">\n\n    <span id="course-group-location"\n         class="disable-select">\n\n        <span data-bind="text:group().getCourseDescription()"></span>\n\n    </span>\n    <span id="course-description"\n         class="disable-select">\n         @\n         <span data-bind="text:group().getBuilding()">\n         </span>\n    </span>\n\n\n  </div>\n\n  <non-member-prompt></non-member-prompt>\n\n  <span id="leave-group-button"\n          data-bind="visible:isLeaveButtonVisible(), click:leaveGroup">\n          leave group\n  </span>\n\n\n\n  <!-- /ko -->\n\n\n</div>\n';});

define('right-panel/course-info/text-info/Component',[
'ko',
'text!right-panel/course-info/text-info/template.html',
'dispatcher/Dispatcher',
'course/CourseStore'],
function(
  ko,
  template,
  Dispatcher,
  Store){

  var ViewModel = function(){

    this.dis = new Dispatcher();
    this.store = Store;
    this.group = ko.observable(null);
    this.isLeaveButtonVisible = ko.observable(false);

    this.onStoreChange = function(){
      this.isLeaveButtonVisible(this.store.isGroupMember());
      this.group(this.store.getCurrentGroup());
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.subscribe(this.onStoreChange);


    this.leaveGroup = function(){
      this.dis.dispatch('leaveSelectedCourse');
    }

}; // end view model.

  return {
    viewModel:ViewModel,
    template: template
  }
});


define('text!right-panel/course-info/course-photos/template.html',[],function () { return '<link rel="stylesheet"\n      href="./styles/components/right-panel/course-info/course-photos.css">\n\n<div id="location-image-holder">\n\n\n  <img id="forum-img"\n       class="disable-select"\n       src="#"\n       data-bind="attr:{src:currentImageUrl()}">\n\n   <input id="location-image-upload-button"\n          type="file"\n          data-bind="event:{change:uploadPhoto}">\n   </input>\n\n   <!-- <span class="glyphicon glyphicon-chevron-left course-section-arrow-left course-section-arrow"\n         data-bind="click:prevSection">\n   </span> -->\n\n   <!-- <span class="glyphicon glyphicon-chevron-right course-section-arrow-right course-section-arrow"\n         data-bind="click:nextSection">\n   </span> -->\n\n   <!-- <button\n            id="next-location-button"\n            data-bind="click:nextPhoto">\n     next\n   </button> -->\n</div>\n';});

define('right-panel/course-info/course-photos/CoursePhoto',[],
function(){

  var CoursePhoto = function(group, image){

    this.setGroup = function(group){
      if(Number.isInteger(group) == false){
        throw new Error('group cant be empty.');
      }
      this.groupId = group;
    }
    this.setGroup(group);


    this.getGroupId = function(){
      return this.groupId;
    }

    this.setImage = function(image){
      if(!image){
        throw new Error("image cant be empty.");
      }
      this.image = image;
    }
    this.setImage(image);


    this.getImage = function(){
      return this.image;
    }




  }

  return CoursePhoto;
});

define('right-panel/course-info/course-photos/Component',[
'ko',
'text!right-panel/course-info/course-photos/template.html',
'dispatcher/Dispatcher',
'course/CourseStore',
'right-panel/course-info/course-photos/CoursePhoto'],
function(
  ko,
  template,
  Dispatcher,
  Store,
  CoursePhoto){

  var ViewModel = function(){

  this.currentImageUrl = ko.observable('./assets/missing-group-photo.jpg');
  this.dis = new Dispatcher();
  this.store = Store;
  this.isVisible = ko.observable(false);


  this.onStoreChange = function(){
    var group = this.store.getGroupInfo();
    this.currentImageUrl(group.getImgUrl()  + '?' + (new Date()).getTime());
  }
  this.onStoreChange = this.onStoreChange.bind(this);
  this.store.subscribe(this.onStoreChange);


    this.uploadPhoto = function(data, event){
      var files = event.currentTarget.files;
      if (files && files[0]) {
          var file = files[0];
          var reader = new FileReader();
          var self = this;
          reader.onload = function(event){
            self.onPhotoReady(event);
          }
          reader.readAsDataURL(file);
      }
    }
    this.uploadPhoto = this.uploadPhoto.bind(this);



    this.onPhotoReady = function (e) {
        var image = e.target.result;
        var groupId = this.store.getGroupId();
        var coursePhoto = new CoursePhoto(groupId, image);
        this.dis.dispatch('saveCoursePhotograph', coursePhoto);
    }
    this.onPhotoReady = this.onPhotoReady.bind(this);



    /**
        Sets the next location. If the end of locations
        is reach it wraps around to beggining again.
    */
    this.nextPhoto = function(){
      // if(this.courseLocations.length > 0){
      //   if(this.currentLocationIndex < this.courseLocations.length - 1){
      //       this.currentLocationIndex++;
      //   }
      //   else{
      //     this.currentLocationIndex = 0;
      //   }
      //   // var location = this.courseLocations[this.currentLocationIndex];
      //   // this.locationImageURL(location.getLocationImageURL());
      //   // this.locationName(location.getLocationName())
      // }
    }
    this.nextPhoto = this.nextPhoto.bind(this);



    }; // end view model.

      return {
        viewModel:ViewModel,
        template: template
      }
    });


define('text!file-dropper/template.html',[],function () { return '<link rel="stylesheet" href="./styles/components/right-panel/file-dropper.css?v=1.0">\n\n\n      <form id="file-dropper-form"\n              data-bind="visible:isVisible()">\n              <div id="upload-button-holder">\n                  <label for="upload-button"\n                         title="Upload File"\n                         data-toggle="tooltip">\n                    <span class="glyphicon glyphicon-open"\n                          id="upload-button-image"></span>\n                  </label>\n                  <input id="upload-button"\n                         type="file"\n                         data-bind="event: { change : uploadFile}"/>\n              </div>\n      </form>\n\n\n      <span id="file-upload-progress-holder"\n            data-bind="visible:uploadInProgress()">\n      <span id="file-upload-progress-percentage"\n            data-bind="text:percentageComplete"></span>\n            <div id="file-upload-progress-bar"></div>\n      </span>\n      <div id="shared-files-holder"\n           class="show-vert-scroll"\n           data-bind="visible:isVisible()">\n           <div id="no-files-shared-message"\n                class="disable-select"\n                data-bind="visible:files().length <= 0">\n              no files shared.\n           </div>\n          <ul id="file-list"\n              class="show-vert-scroll"\n              data-bind="foreach: files">\n              <li>\n                <div class ="shared-files-holder "\n                     data-bind="css:{\'opened-file\' : user_opened(), \'unopened-file\' : !user_opened()},\n                                click:$parent.downloadFile">\n\n                  <div class="file-name-holder shared-files-text disable-select"\n                       data-bind="text:name">\n                  </div>\n                  <span class="trashbin glyphicon glyphicon-trash"\n                        data-toggle="tooltip"\n                        title="Delete"\n                        data-bind="click:$parent.deleteFile">\n                  </span>\n                </div>\n\n              </li>\n          </ul>\n        </div>\n';});



define('file-dropper/FileSharerRemoteService',['ActiveRemoteService',
        'format-converter'],
function(ActiveRemoteService,
         FormatConverter){

  var FileSharerRemoteService = function(){

      Object.setPrototypeOf(this,new ActiveRemoteService());
      this.sock = null;
      this._callbacks = {};
      this.setMicroServer("files");

      /**
       * Initializes the socket instance.
       */
      this.initSocket = function(){
        this.setSock();
      }

      this.registerFileUploadCallback = function(callback){
        this.sock.on('fileUpload',callback);
      }

      this.registerFileDeleteCallback = function(callback){
        this.sock.on('fileDelete',callback);
      }

       this.registerUploadProgressCallback = function(cb){
         this._callbacks['uploadProgressCallback'] = cb;
       }


      /**
       * Returns the first fileUpload callback for the socket.
       * There should be only one fileupload callback,  all others
       * are ignored.
       * @return {Function}
       */
      this.getFileUploadCallback = function(){
        let callbacks = this.sock._callbacks.$fileUpload;
        if(!callbacks){
          throw new Exception("no callback for that event is registered.");
        }
        else{
          return callbacks[0];
        }
      }
      /**
       * Sets the file  with the given name as opened, by the current user.
       */
      this.setFileAsOpened = function(fileName, friendId, onSuccess){
        // http://files.localhost/57/seen/Untitled%201.docx
        var url = this.getServerURL() + "/" + friendId + "/seen/" + fileName;
        // console.log(url);
          $.ajax({
            url:url,
            type:"POST",
            beforeSend:this.setAuthorizationHeader,
            success:onSuccess,
            error:function(a,b,err){
              console.log(err);
            }
          })
      }



      /**
       * Loads all the files shared between the current user
       * and the given friend.
       * @param  {Number} friendId  The userId of the currently selected friend.
       * @param  {Function} onSuccess callback function that
       * is executed with the list of files that are shared
       * between the two users.
       */
      this.loadFiles = function(friendId, onSuccess){
        var self = this;

        $.ajax({
          url:this.getServerURL() + "/" + friendId + "/files",
          type:"GET",
          cache:true,
          beforeSend:this.setAuthorizationHeader,
          success:function(response){
            var files = JSON.parse(response);
            for(var i = 0; i < files.length; i++){
              files[i].url = self.getServerURL() + "/" + files[i].url;
            }
            onSuccess(files);
          },
          error:function(jq,status,err){
            console.log(err);
          }
        })
      }


      /**
       * requests that the server delete the given file.
       * @param  {string} fileName
       * @param  {Number} friendId  int
       * @param  {Function} onSuccess callback.
       */
      this.deleteFile = function(fileName,friendId, onSuccess){

        var self = this;
        var url = this.getServerURL() + '/' + friendId + "/" + fileName;
        $.ajax({
            url:url,
            type: 'DELETE',
            beforeSend:this.setAuthorizationHeader,
            success: function(result) {
              onSuccess();
            },
            error:function(a,b,c){
              console.log(a.responseText);
              console.log(c);
            }
        });
      }




      /**
       * @param  {[type]} fileData is the image in base64 format.
       * @param {Function} callback is called on successful upload of the fileData.
       */
      this.uploadFile = function(fileData, fileName, friendId, onSuccess, onFailure){

        var data = fileData.replace(/^data:(.*);base64,/, "");
        var blob = FormatConverter.base64ToBlob(data);
        var formData = new FormData();
        formData.append('fileName', fileName);
        formData.append('friendId',friendId);
        formData.append('file', blob);
        var self = this;
        $.ajax({
          url:this.getServerURL() + '/uploadFile',
          type:"POST",
          contentType:false,
          processData:false,
          data:formData,
          beforeSend:this.setAuthorizationHeader,
          xhr:function(){
            var xhr = new window.XMLHttpRequest();
                xhr.upload
                   .addEventListener("progress",
                                      self._callbacks.uploadProgressCallback,
                                      false
                                    );
            return xhr;
          },
          success:function(fileResponse){
            var response = JSON.parse(fileResponse);
            response.url = self.getServerURL() + "/" + response.url;
            onSuccess(response);
          },
          error:function(jq,status,err){
            onFailure(jq.responseText);
          }
        })
      }
      this.uploadFile = this.uploadFile.bind(this);
  }


  return FileSharerRemoteService;

})
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */

define('right-panel/file-dropper/Component',[
'jquery',
'ko',
'text!file-dropper/template.html',
'postbox',
'file-dropper/FileSharerRemoteService',
'dispatcher/Dispatcher',
'people-store/PeopleStore'],
function($,
  ko,
  template,
  postbox,
  FileSharerRemoteService,
  Dispatcher,
  Store){

  function SharedFilesViewModel(params,componentInfo){


    this._remoteService = new FileSharerRemoteService();
    this.dis = new Dispatcher();
    this.store = Store.getInstance();
    this.files = ko.observableArray([]);
    this.isVisible = ko.observable(false);
    this.uploadInProgress = ko.observable(false);
    this.percentageComplete = ko.observable("0");
    this.selectedClassmateId = -1;
    this._fileToBeUploaded = null;
    this.FILE_SIZE_LIMIT = 25000000; // about 25 megabytes.

    /**
     * Formats the url so that it has the server URL prefixed to it.
     * @param  {[type]} response
     */
    this.formatURL = function(response){
      response.url = this._remoteService.getServerURL() + "/" + response.url;
      if(response.senderId == this.selectedClassmateId){
        this.onSuccessfulUpload(response);
      }
      // console.log("response.url == " + response.url);
    }
    this.formatURL = this.formatURL.bind(this);


    /**
     *
     * @param  {[type]} deleteMsg [description]
     * @return {[type]}           [description]
     */
    this.friendDeleteFile = function(deleteMsg){
      if(deleteMsg.senderId == this.selectedClassmateId){
        this.removeFileFromView(deleteMsg.name);
      }
    }
    this.friendDeleteFile = this.friendDeleteFile.bind(this);


    /**
     * Shows the view when the user state becomes authenticated and
     * Initializes the socket using the users token,
     * @param  {string} state
     */
    this.onAuth = function(update){
       if(update.state == 'authenticated'){
          this._remoteService.initSocket();
          this._remoteService.registerFileUploadCallback(this.formatURL);
          this._remoteService.registerFileDeleteCallback(this.friendDeleteFile);
          this._remoteService.registerUploadProgressCallback(this.uploadProgressCallback);
       }
       else{
         this.isVisible(false);
       }
    }
    this.onAuth = this.onAuth.bind(this);
    this.dis.reg('authState',this.onAuth);





    this.onFilesDownloaded = function(files){
        this.files([]);
        for(var i = 0; i < files.length; i++){
            files[i].user_opened = ko.observable(files[i].user_opened);
            this.files.push(files[i]);
        }
    }
    this.onFilesDownloaded = this.onFilesDownloaded.bind(this);


    /**
     *  Changes the state 'opened' to true for the
     *  file with the given fileName.
     */
    this.showFileAsSeen = function(fileName){
      var self = this;

      return function(){
        for(var i = 0; i < self.files().length; i++){
          if(self.files()[i].name == fileName){
            self.files()[i].user_opened(true);
            break;
          }
        }
      }
    }
    this.showFileAsSeen = this.showFileAsSeen.bind(this);



    /**
     * @pre: expects the accessToken to be
             stored in localStorage and the selectedFriend
             observable to be the currently selected
             friendId.

     * @post: Query's the remote service for the list
     *        of all files shared between this user
     *        and the currently selected friend.
     */
    this.onStoreChange = function(){
      var classmate = this.store.getFocusedPerson();
      if(!classmate){
        this.isVisible(false);
      }
      else{
        this.selectedClassmateId = classmate.getId();
        this._remoteService.loadFiles(this.selectedClassmateId, this.onFilesDownloaded);
        this.isVisible(true);
      }
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.sub(this.onStoreChange);

    /**
     * downloads the file from the remote service
     * and displays it too the user. If
     * the file has not been opened before then
     * it sends a message to the remote service
     * that the file has now been opened.
     */
    this.downloadFile = function(data, event ,testMode){
      if(testMode != 'test'){
        window.open(data.url,'_blank');
      }

      if(!data.user_opened()){
        var self = this;
        var fileName = data.name;
        this._remoteService
            .setFileAsOpened(
              data.name,
              this.selectedClassmateId,
              this.showFileAsSeen(fileName));
      }
    }
    this.downloadFile = this.downloadFile.bind(this);

    /**
     * Uploads the file to the server.
     * @param  data is the file that was clicked.
     */
    this.uploadFile = function(data, input, testMode){

      if(!this.uploadInProgress()){
        if(testMode){
          testMode.callback();
        }
        if(input.target.files && input.target.files[0]){
          var reader = new FileReader();
          this._fileToBeUploaded = input.target.files[0];
          if(this._fileToBeUploaded.size > this.FILE_SIZE_LIMIT){
            alert('Files greater than 10mb cant be uploaded at the moment.');
            return;
          }
          var self = this;
          reader.onload = function(event){
            self.clearFileChooserInput(input.target);
            self.onFileLoadedInBrowser(event);
            $('#file-dropper-upload-btn').val('');
          }
          reader.readAsDataURL(this._fileToBeUploaded);
        }
      }
      else{
        alert('Only one file can be uploaded at a time.');
        $('#file-dropper-upload-btn').val('');
      }
    }
    this.uploadFile = this.uploadFile.bind(this);

    this.clearFileChooserInput = function(inputElement){
      var $el = $(inputElement);
      $el.wrap('<form>').closest('form').get(0).reset();
      $el.unwrap();
    }
    this.clearFileChooserInput = this.clearFileChooserInput.bind(this);


    this.uploadProgressCallback = function(event){
     this.uploadInProgress(true);
     var percent = (event.loaded / event.total) * 100;
     var progress = Math.round(percent);
     var strPercent = progress + "%";
     this.percentageComplete(strPercent);
     $('#file-upload-progress-bar').css('width',strPercent);
   }
   this.uploadProgressCallback = this.uploadProgressCallback.bind(this);



    /**
     * @param  {Event} event the fileReader has completed reading
     *  the file as a URL.
     */
    this.onFileLoadedInBrowser = function(event){

      for(var i = 0; i < this.files().length; i++){
        if(this.files()[i].name == this._fileToBeUploaded.name){
          alert("A file already exists with that name, please choose another name.");
          return;
        }
      }
      this._remoteService
          .uploadFile(
            event.target.result,
            this._fileToBeUploaded.name,
            this.selectedClassmateId,
            this.onSuccessfulUpload,
            this.onFailedUpload);
    }
    this.onFileLoadedInBrowser = this.onFileLoadedInBrowser.bind(this);



    this.onFailedUpload = function(httpResponseText){
      this.uploadInProgress(false);
      alert(httpResponseText);
    }
    this.onFailedUpload = this.onFailedUpload.bind(this);


    /**
     * Puts the uploaded file name at the top of the
     * list given the fileResponse from the server.
     */
    this.onSuccessfulUpload = function(fileResponse){
      if(!fileResponse.name || typeof fileResponse.user_opened == 'undefined' || !fileResponse.url)
      {
        throw new Error('invalid file response! Are you sure you did JSON.parse?');
      }

      fileResponse.user_opened = ko.observable(fileResponse.user_opened);
      this.files.unshift(fileResponse);
      this.uploadInProgress(false);
    }
    this.onSuccessfulUpload = this.onSuccessfulUpload.bind(this);


    /**
     *  Asks the remote service to delete the given file.
     * @param  {[type]} data  must have
     * @param  {[type]} event
     */
    this.deleteFile = function(data, event){

        if(event){
          event.stopPropagation();
        }
        var self = this;
        this._remoteService.deleteFile(
          data.name,
          this.selectedClassmateId,
          function(){
              self.removeFileFromView(data.name);
          });
    }
    this.deleteFile = this.deleteFile.bind(this);


    /**
     * Removes the file from files which have
     * the same name as fileName.
     * @param  {[type]} fileName [description]
     */
    this.removeFileFromView = function(fileName){

      for(var i = 0; i < this.files().length; i++){
        if(this.files()[i].name == fileName){
          this.files.splice(i,1);
          break;
        }
      }
    }
    this.removeFileFromView = this.removeFileFromView.bind(this);



}; // end view model.

  return {
    viewModel: SharedFilesViewModel,
    template: template
  }
});


define('text!right-panel/person-info/template.html',[],function () { return '\n<link rel="stylesheet"\n      href="./styles/components/right-panel/person-info.css?v=1.0">\n\n\n\n\n<div id="person-info-holder" data-bind="visible:isVisible()">\n\n      <div id="large-user-photo-holder">\n        <img id="person-info-photo"\n             class="disable-select"\n             src="#"\n             data-bind="visible:isPhotoVisible(),\n                        attr:{src:selectedClassmate().getLargePhotoURL()}">\n        </img>\n        <call-buttons>\n        </call-buttons>\n      </div>\n\n\n      <div id="person-info-name"\n           class="disable-select"\n           data-bind="text:selectedClassmate().getFirst()">\n      </div>\n\n      <div id="class-major-holder">\n        <i id="academic-cap"\n           class="glyphicon glyphicon-education"></i>\n        <span id="classmate-major"\n              data-bind="text:selectedClassmate().getEducationLevel()">\n        </span>\n      </div>\n\n      <current-courses></current-courses>\n      <div  data-bind="visible:isAddPalVisible()"\n            class="right-panel-add-pal-holder">\n        <button class="add-pal add-pal-btn right-panel-add-pal"\n                data-bind="click:addPal">\n                add friend\n        </button>\n      </div>\n\n</div>\n';});

define('right-panel/person-info/Component',[
'jquery',
'ko',
'text!right-panel/person-info/template.html',
'dispatcher/Dispatcher',
'people-models/NullPerson',
'people-store/PeopleStore'],
function(
  $,
  ko,
  template,
  Dispatcher,
  NullPerson,
  Store){

  var ViewModel = function(){

      this.dis = new Dispatcher();
      this.store = Store.getInstance();
      this.isVisible = ko.observable(false);
      this.selectedClassmate = ko.observable(new NullPerson());
      this.isPhotoVisible = ko.observable(true);
      this.isExperimentalGroup = false;
      this.isAddPalVisible = ko.observable(false)



      this.onStoreUpdate = function(){
        var p = this.store.getFocusedPerson();
        if(!p.isReal()){
          this.isVisible(false);
        }
        else{
          this.selectedClassmate(p);
          this.isVisible(true);
          this.isAddPalVisible(p.isAddable())
        }
      }
      this.onStoreUpdate = this.onStoreUpdate.bind(this);
      this.store.sub(this.onStoreUpdate);



      this.onVideoCallUpdate = function(data){
        if(typeof data != 'object'){
          throw new Error('onVideoCallUpdate expects data to be an object');
        }
        if(typeof data.isOn != 'boolean'){
          throw new Error('isOn must be a boolean');
        }
        var videoIsOn = data.isOn;
        var connectedClassmateId = data.classmateId;
        var selectedClassmateId = this.selectedClassmate().getId();
        if(videoIsOn){
          if(connectedClassmateId < 1 || isNaN(connectedClassmateId)){
            throw new Error('connectedClassmateId must be a positive number.');
          }
          if(connectedClassmateId != selectedClassmateId){
            this.isPhotoVisible(true);
          }
          else{
            this.isPhotoVisible(false);
          }
        }
        else{
          this.isPhotoVisible(true);
        }
      }
      this.onVideoCallUpdate = this.onVideoCallUpdate.bind(this);
      this.videoStateCallbackId = this.dis.reg('videoStateUpdate', this.onVideoCallUpdate);

      this.addPal = function(){
        var classmate = this.selectedClassmate()
        if(classmate.isAddable()){
          this.dis.dispatch('addPal',classmate)
        }
      }
      this.addPal = this.addPal.bind(this)


}; // end view model.

  return {
    viewModel:ViewModel,
    template: template
  }
});


define('text!call-buttons/template.html',[],function () { return '<link rel="stylesheet" href="./styles/components/right-panel/call-buttons.css">\n\n  <div id=\'call-btns\' data-bind="visible:isVisible()">\n\n      <div  class="call-button-holder"\n            data-bind="if:callButtonEnabled()">\n\n        <button id="pickup-btn"\n                class="call-btn"\n                data-bind="click:callButtonPressed">\n                <img id="pickup-img"\n                     data-toggle="tooltip"\n                     class="phone-img"\n                     src="./assets/pickup-img.png"\n                     data-bind="attr:{title:callButtonToolTip}"\n                     title="Call">\n         <span class="call-button-text"\n               data-bind="text:callButtonText">\n         </span>\n        </button>\n\n      </div>\n\n\n      <!-- end  if callEnabled -->\n\n       <div   class="call-button-holder"\n              data-bind="if:hangupButtonEnabled()">\n         <button\n                 class="call-btn hangup-btn"\n                 data-bind="click:hangupButtonPressed">\n\n           <img\n             class="phone-img hangup-img"\n             src="./assets/hangup-img.png"\n             data-bind="css: { disabled: hangupButtonEnabled() === false },\n                       attr:{title:hangupButtonToolTip}">\n           </img>\n           <span class="call-button-text"\n                 data-bind="text:callButtonText">\n           </span>\n         </button>\n       </div>\n\n\n    </div>\n';});

define('right-panel/person-info/call-buttons/Component',['ko',
        'dispatcher/Dispatcher',
        'text!call-buttons/template.html',],
function(
  ko,
  Dispatcher,
  template
){

  var ViewModel = function(params, componentInfo){
    this._dispatcher = new Dispatcher();
    this.isVisible = ko.observable(false);
    this.callButtonEnabled = ko.observable(false);
    this.callButtonText = ko.observable('');
    this.hangupButtonEnabled = ko.observable(false);
    this.callButtonToolTip = ko.observable('');
    this.hangupButtonToolTip = ko.observable('');

    this.onCallPanelUpdate = function(update){
        this.isVisible(update.buttonPanelVisible);
        this.callButtonEnabled(update.callEnabled);
        this.callButtonText(update.callButtonText);
        this.callButtonToolTip(update.callButtonToolTip);
        this.hangupButtonEnabled(update.hangupButtonEnabled);
        this.hangupButtonToolTip(update.hangupButtonToolTip);
    }
    this.onCallPanelUpdate = this.onCallPanelUpdate.bind(this);
    this._dispatcher.reg('callPanelUpdate',this.onCallPanelUpdate);


    this.onAuth = function(update){
      if(update.state == 'authenticated'){
        this._dispatcher.dispatch('callPanelQuery');
      }
    }
    this.onAuth = this.onAuth.bind(this);
    this._dispatcher.reg('authState', this.onAuth);



    this.callButtonPressed = function(){
      this._dispatcher.dispatch('callButtonPressed');
    }

    this.hangupButtonPressed = function(){
      this._dispatcher.dispatch('hangupButtonPressed');
    }

}; // end view model.

  return {
    viewModel:ViewModel,
    template: template
  }
});

define('abstract-interfaces/Observer',[],function(){

  var Observer = function(){

    /**
     *
     * @param  {[type]} message
     * @param  {[type]} subject is the instance which
     *  executed the update.
     */
      this.update = function(message,subject){
         // does nothing, override is optional.
      }

      /**
       * Returns the name of this interface.  this
       * is too get around a limitation of
       * internet explorer, it does not support
       * constructor.name.
       */
      this.isObserver = function(){
        return true;
      }



      this.getName = function(){
        return this.constructor.name;
      }

  }
  // does not work in MS Edge.
  Observer.constructor.name = "Observer";
  return Observer;


})
;
define('video-chat/states/State',['abstract-interfaces/Observer'],function(CallObserver){

  var throwError = function(){
    throw Error("abstract functions cant be exectued");
  }

  var State = function State(context){

    if(!context){
      throw new Error('Context must be set.');
    }


    Object.setPrototypeOf(this,new CallObserver());
    this._context = context;

    this.constructor = State;

    this.isSpinnerVisible = false;
    this.isInCall = false;

    this.callButtonText = "";
    this.hangupEnabled = false;
    this.hangupToolTip = "";
    this.callEnabled = false;
    this.callButtonToolTip = "";

    this.isDialogVisible = false;
    this.isDialogSpinnerVisible = false;
    this.isDialogAnswerButtonsVisible = true;
    this.callerName = "";
    this.connectionProgress = '';
    this.connectionStatus = '';


    this.getConstructorName = function(){
      return "State";
    }


    /**
     * Takes a webRTC message and converts it into a more human
     * friendly dorm.
     * @param  {[type]} message [description]
     */
    this.getHumanMessage = function(message){

      var humanMessage = "";
      if(message == 'new'){
        humanMessage = "Waiting for friends candidate connection..";
      }
      else if(message == "checking"){
        humanMessage = "Checking media compatibility..";
      }
      else if(message == 'connected'){
        humanMessage= "Connected established!";
      }
      else if(message == "failed"){
        humanMessage = "Failed to find compatible media formats. Retrying..";
      }
      else if(message == 'disconnected'){
        humanMessage = "Experencing connection issues..";
      }
      else{
        humanMessage = message;
      }
      return humanMessage;
    }

    this.begin = function(){
      throwError();
    }

    this.end = function(){
      throwError();
    }

    this.activate = function(){
        throwError();
    }

    this.deactivate = function(){
        throwError();
    }

    this.handleCourseChange = function(){
      // does nothing.
    }

    this.onFriendIdChange = function(){
      // does nothing.
    }

    this.emitIamAvailable = function(){
      this.tellEveryoneIamAvailable();
    }
    this.emitIamAvailable = this.emitIamAvailable.bind(this);

    this.validateQuery = function(query){
      if(!query || !query.senderId|| isNaN(query.senderId)){
        throw new Error('StateQuery senderId must be a positive integer.');
      }
    }


  } // end constructor.
  return State;
});


define('text!video-chat/template.html',[],function () { return '\n<link rel="stylesheet" href="./styles/components/right-panel/video-chat.css">\n\n<div id="video-chat-holder"\n     data-bind="visible:isVisible()">\n\n  <div data-bind="if: authState() == \'authenticated\'">\n        <audio id="ringPhone">\n          <source src="/assets/sounds/ringloop.wav" type="audio/wav">\n          Your browser does not support the audio element.\n        </audio>\n\n      <div class="manual-test-harness"\n           data-bind="visible:true">\n        <div class="harness-controls">\n          <button\n            data-bind="click:attachManualTestHarness"\n          >Init Harness\n          </button>\n          <button\n            data-bind="click:simulateFailedWebRTCConnection"\n          >Simulate Failed\n          </button>\n        </div>\n      </div>\n\n\n\n\n        <div id=\'interaction-holder\'>\n            <div id="videos-holder">\n              <video id="tiny-video"\n                    data-bind="visible:isTinyVideoVisible() && state().isInCall"\n                    autoplay>\n              </video>\n              <video class="video-conference"\n                      id="big-video"\n                     data-bind="visible:isLargeVideoVisible() && state().isInCall"\n                     autoplay>\n              </video>\n            </div>\n\n            <!-- spinner -->\n            <div data-bind="visible:isSpinnerVisible()">\n              <div>Connecting...</div>\n              <div  class="screen-center-outer">\n               <div class="screen-center-inner">\n                  <div id="chore-loader" class="loader"></div>\n               </div>\n             </div>\n            </div>\n\n            <div class="error-message"\n                 id="video-call-error"\n                 data-bind="visible:true">\n                <span data-bind="text:errorMessage"></span>\n            </div>\n\n        </div>\n\n            <call-dialog params="store:store, callerInfo:callerInfo()">\n            </call-dialog>\n\n          </div>  <!-- end if authenticated -->\n\n      </div>\n</div>\n\n\n\n\n\n<!-- end of video-chat holder -->\n  </div>\n';});

define('video-chat/states/connected/your-available/call-periphery/call-connected/CallConnected',['video-chat/states/State'],function(State){

  var CallConnected = function CallConnected(context){

    var state = new State(context);
    Object.setPrototypeOf(this,state)
    this.constructor = CallConnected;
    this.isInCall = true;
    this.callButtonText = "Hang up."
    this.hangupEnabled = true;
    this.hangupToolTip = "End call";
    this.isCallBtnPanelVisible = true;
    this.callerId = null;


    this.getConstructorName = function(){
      return "CallConnected";
    }

    /**
     * @overriden because selecting another
     * friend should not hang up the call.
     */
    this.onFriendChange = function(friendId){
      // does nothing.
    }

    this.update = function(update, subject){
      this.connectionStatus = this.connectionStatus + "<div>" + this.getHumanMessage(update) + "</div>";
      this._context.state.valueHasMutated();
      if(update === "closed"){
        this._context.tellEveryoneIamAvailable();
        this._context.setState("InitialState");
      }
      else if(update === 'failed'){
        this._context.reconnectCall();
      }
    }


    this.handleStateUpdate = function(){
      throw new Error('Must be implemented in a derived class.');
    }
    this.handleStateUpdate = this.handleStateUpdate.bind(this);


    this.handleStateQuery = function(query){
      this._context.emitIamNotAvailableTo(query.senderId);
    }
    this.handleStateQuery = this.handleStateQuery.bind(this);


    this.activate = function(){
      this._context.possiblyResizeVideo();
    }
    this.activate = this.activate.bind(this);


    this.deactivate = function(){
      throw new Error('Cant invoke abstract function.');
    }
    this.deactivate = this.deactivate.bind(this);
  }

  return CallConnected;
});

define('video-chat/states/connected/your-available/call-periphery/call-connected/ConnectedToRecipient',['video-chat/states/connected/your-available/call-periphery/call-connected/CallConnected'],
function(CallConnected){

  var ConnectedToRecipient = function ConnectedToRecipient(context){

    Object.setPrototypeOf(this, new CallConnected(context));
    this.constructor = ConnectedToRecipient;
    this.callConnectedPrototype = Object.getPrototypeOf(this);


    this.getConstructorName = function(){
      return "ConnectedToRecipient";
    }


    this.activate = function(){
       var recipientId = this._context.getLastCallRecipientId();
       if(recipientId < 1 || isNaN(recipientId)){
         throw new Error('ConnectedToRecipient requires that recipientId be set before activation.');
       }
       this._context.setConnectedClassmateId(recipientId);
       this._context.emitVideoState(recipientId);
       Object.getPrototypeOf(this).activate();
       this._context.registerOnQueryStateCallback(this.handleStateQuery);
       this._context.registerOnStateUpdateCallback(this.handleStateUpdate);
    }
    this.activate = this.activate.bind(this);

    this.deactivate = function(){
      this._context.unregisterOnQueryStateCallbacks();
      this._context.unregisterOnStateUpdateCallbacks();
      this._context.eraseConnectedClassmateId();
      this._context.emitVideoState();
    }

    this.end = function(){
        this._context.setState("IamCallerAndHungUp");
    }

    this.handleStateUpdate = function(update){
      var theirId = this._context.getLastCallRecipientId();
      if(!update.info.id || isNaN(update.info.id)){
        throw new Error("Malformed state update.");
      }
      if(theirId == update.info.id && update.state != "AnsweringCall"){
        this._context.setState("CalleeHungUp");
      }
    }
    this.handleStateUpdate = this.handleStateUpdate.bind(this);

  }

  return ConnectedToRecipient;
});

define('video-chat/states/connected/your-available/call-periphery/call-connected/ConnectedToCaller',['video-chat/states/connected/your-available/call-periphery/call-connected/CallConnected'],
function(CallConnected){

  var ConnectedToCaller = function ConnectedToCaller(context){

    Object.setPrototypeOf(this,new CallConnected(context));
    this.constructor = ConnectedToCaller;

    this.getConstructorName = function(){
      return "ConnectedToCaller";
    }

    this.handleStateUpdate = function(update){
      var id = update.info.id;
      var stateName = update.state;
      var callerId = this._context.getLastCallerInfo().id;
      if(callerId == id && stateName == "IamCallerAndHungUp"){
        this._context.closeConnection();
        this._context.tellEveryoneIamAvailable();
        this._context.setState("InitialState");
      }
    }
    this.handleStateUpdate = this.handleStateUpdate.bind(this);


    this.end = function(){
        this._context.setState("IamCalleeAndHungUp");
    }


    this.activate = function(){
      let callerId = this._context.getLastCallerInfo().id;
      this._context.setConnectedClassmateId(callerId);
      Object.getPrototypeOf(this).activate();
      this._context.registerOnStateUpdateCallback(this.handleStateUpdate);
      this._context.registerOnQueryStateCallback(this.handleStateQuery);

      this._context.emitCallStarted(callerId);
      this._context.emitVideoState(callerId);
    }
    this.activate = this.activate.bind(this);



    this.deactivate = function(){
      this._context.unregisterOnStateUpdateCallbacks();
      this._context.unregisterOnQueryStateCallbacks();
      this._context.emitCallEnded();
      this._context.eraseConnectedClassmateId();
      this._context.emitVideoState();
    }
    this.deactivate = this.deactivate.bind(this);


  }

  return ConnectedToCaller;
});

define('video-chat/states/connected/your-available/_YouAreAvailable',['video-chat/states/State'],function(State){


  var _YouAreAvailable = function _YouAreAvailable(context){

      var abtractState = new State(context);
      Object.setPrototypeOf(this,abtractState);
      this.constructor = _YouAreAvailable;

      this.handleStateUpdate = function(update){
        if(update.state == 'CallingThem'){
          this._context.setLastCallerInfo(update.info);
          this._context.setState("FriendIsCallingYou");
        }
        else{
          this.friendStateUpdate(update);
        }
      }
      this.handleStateUpdate = this.handleStateUpdate.bind(this);


      this.friendStateUpdate = function(update){

          if(!update || !update.state || !update.info.id){
            throw new Error('State update object is malformed.');
          }
          var info = update.info;
          var state = update.state;
          var stateName = this.constructor.name;
          if(info.id == this._context.currentSelectedClassmateId()){
            if(state == "IamAvailable" && stateName != "FriendIsAvailable"){
              this._context.setState("FriendIsAvailable");
            }
            else if(state == "IamNotAvailable" && stateName != "FriendNotAvailable"){
              this._context.setState("FriendNotAvailable");
            }
        }
      }



      this.handleStateQuery = function(query){
        if(!query || !query.senderId || isNaN(query.senderId)){
          throw Error('query object is missing or malformed');
        }
        else{
          this._context.emitIamAvailableTo(query.senderId);
        } // end else.
      }
      this.handleStateQuery = this.handleStateQuery.bind(this);



      this.onFriendIdChange = function(){
        var friendId = this._context.currentSelectedClassmateId();
        if(friendId == null){
          this._context.setState('NoOneSelected');
        }
        else if(!isNaN(friendId) && friendId > 0){
          this._context.emitFriendStateQuery(friendId);
        }
      }


      this.activate = function(){
        this._context.registerOnStateUpdateCallback(this.handleStateUpdate);
        this._context.registerOnQueryStateCallback(this.handleStateQuery);
      }

      this.deactivate = function(){
        this._context.unregisterOnStateUpdateCallbacks();
        this._context.unregisterOnQueryStateCallbacks();
      }
  } // end constructor

  return _YouAreAvailable;
});

define('video-chat/states/connected/your-available/InitialState',['video-chat/states/connected/your-available/_YouAreAvailable'],
function(_YouAreAvailable){

  var InitialState = function InitialState(context){

     Object.setPrototypeOf(this,new _YouAreAvailable(context));
     this.constructor = InitialState;
     this.isSpinnerVisible = true;

    this.activate = function(){
      var friendId = this._context.currentSelectedClassmateId();
      if(friendId < 1){
        this._context.setState('NoOneSelected');
      }
      else{
        Object.getPrototypeOf(this).activate();
        this._context.emitFriendStateQuery(friendId);
      }
    }
    this.activate = this.activate.bind(this);

  }
  return InitialState;
});

define('video-chat/states/connected/your-available/NoOneSelected',['video-chat/states/connected/your-available/_YouAreAvailable'],
function(YouAreAvailable){

  var NoOneSelected = function NoOneSelected(context){
      Object.setPrototypeOf(this, new YouAreAvailable(context));
      this.constructor = NoOneSelected;
      this.isUserImgVisible = false;

    this.activate = function(){
      Object.getPrototypeOf(this).activate();
    }

    this.deactivate = function(){
      Object.getPrototypeOf(this).deactivate();
    }


  }
  return NoOneSelected;
});

define('video-chat/states/connected/your-available/FriendIsAvailable',['video-chat/states/connected/your-available/_YouAreAvailable'],function(State){
  var FriendIsAvailable = function FriendIsAvailable(context){

      var abtractState = new State(context);
      Object.setPrototypeOf(this, abtractState);
      this.constructor = FriendIsAvailable;

      this.callEnabled = true;
      this.callButtonText = "Call now.";
      this.callButtonToolTip = "Call now.";
      this.isCallBtnPanelVisible = true;

      this.begin = function(){
        var recipientId = this._context.currentSelectedClassmateId();
        this._context.setLastCallRecipientId(recipientId);
        this._context.setState("CallingThem");
      }
  } // end constructor

  return FriendIsAvailable;
});

define('video-chat/states/connected/your-available/FriendNotAvailable',['video-chat/states/connected/your-available/_YouAreAvailable'],
function(_YouAreAvailable){

  var FriendNotAvailable = function FriendNotAvailable(context){

    Object.setPrototypeOf(this, new _YouAreAvailable(context));
    this.constructor = FriendNotAvailable;
    this.callEnabled = false;

  }
  return FriendNotAvailable;

});

define('video-chat/states/connected/your-available/call-periphery/_CallPeriphery',['video-chat/states/State'],function(State){

  var _CallPeriphery = function _CallPeriphery(context){

    var state = new State(context);
    Object.setPrototypeOf(this,state);

    this.constructor = _CallPeriphery;

    this.detectAndHandleHangup = function(update){

      if(!update || !update.info.id || isNaN(update.info.id) || !update.state){
        throw new Error('Malformed state update object.');
      }

      let id = update.info.id;
      let lastCallerId = this._context.getLastCallerInfo().id;
      let stateName = update.state;

      if(id == lastCallerId){
        if(stateName == "IamCallerAndHungUp" || stateName == "IamNotAvailable"){
          this._context.tellEveryoneIamAvailable();
          this._context.setState("InitialState");
        }
      }
    }

    this.handleStateUpdate = function(update){
      console.log("Abstract handleStateUpdate");
      console.log(update);

    }
    this.handleStateUpdate = this.handleStateUpdate.bind(this);

    this.handleStateQuery = function(query){
      this.validateQuery(query);
      this._context.emitIamNotAvailableTo(query.senderId);
    }
    this.handleStateQuery = this.handleStateQuery.bind(this);


    this.activate = function(){
      this._context.registerOnStateUpdateCallback(this.handleStateUpdate);
      this._context.registerOnQueryStateCallback(this.handleStateQuery);
    }

    this.deactivate = function(){
      this._context.unregisterOnStateUpdateCallbacks();
      this._context.unregisterOnQueryStateCallbacks();
    }


    this.update = function(message,subject){
    }

    this.begin = function(){
    }

    this.end = function(){
    }
    this.end = this.end.bind(this);


  }
  return _CallPeriphery;
});

define('video-chat/states/connected/your-available/call-periphery/CallingThem',['video-chat/states/connected/your-available/call-periphery/_CallPeriphery'],function(CallPeriphery){


  var CallingThem = function CallingThem(context){

    Object.setPrototypeOf(this, new CallPeriphery(context));
    this.constructor = CallingThem;

    this.callButtonText = "Calling...";
    this.hangupEnabled = true;
    this.hangupToolTip = "Hang up.";
    this.isCallBtnPanelVisible = true;
    this.calleeId = null;



    this.handleStateUpdate = function(update){
      var theirId = this._context.getLastCallRecipientId();
      if(!update.info.id || isNaN(update.info.id)){
        throw new Error("Malformed state update.");
      }
      if(theirId == update.info.id && update.state != "AnsweringCall"){
        this._context.setState("CalleeHungUp");
      }
    }
    this.handleStateUpdate = this.handleStateUpdate.bind(this);

    this.end = function(){
      this._context.setState("IamCallerAndHungUp");
    }
    this.end = this.end.bind(this);


    this.update = function(update, subject){
      // console.log(update);
      if(update == 'connected'){
        console.log(subject);
        this._context.setState('ConnectedToRecipient');
      }
    }

    this.activate = function(){
      Object.getPrototypeOf(this).activate();
      this._context.registerOnStateUpdateCallback(this.handleStateUpdate);
      this._context.emitCallThem();
      this._context.startRingingSound();
    }

    this.deactivate = function(){
      Object.getPrototypeOf(this).deactivate();
      this._context.stopRingingSound();
    }


  }

  return CallingThem;
});

define('video-chat/states/connected/your-available/call-periphery/FriendIsCallingYou',['video-chat/states/connected/your-available/call-periphery/_CallPeriphery','jquery'],function(CallPeriphery,$){

  var FriendIsCallingYou = function FriendIsCallingYou(context){
    var superInstance = new CallPeriphery(context);
    Object.setPrototypeOf(this,superInstance);

    this.constructor = FriendIsCallingYou;

    this.callEnabled = false;
    this.pickupToolTip = "Answer";
    this.isCallBtnPanelVisible = true;
    this.isDialogVisible = true;

    this.handleStateUpdate = function(update){
      var prototype = Object.getPrototypeOf(this);
      prototype.detectAndHandleHangup(update);

    }
    this.handleStateUpdate = this.handleStateUpdate.bind(this);

    this.begin = function(){
      this._context.setState("AnsweringCall");
    }

    this.end = function(){
      this._context.setState('IamCalleeAndHungUp');
    }
    this.end = this.end.bind(this);

    this.activate = function(){
      Object.getPrototypeOf(this).activate();
      this._context.registerOnStateUpdateCallback(this.handleStateUpdate);
      this._context.startRingingSound();
    }

    this.deactivate = function(){
      Object.getPrototypeOf(this).deactivate();
      this._context.stopRingingSound();
      this._context.unregisterOnStateUpdateCallbacks();
    }

  }
  return FriendIsCallingYou;
});

define('video-chat/states/connected/your-available/call-periphery/CallHungUp',['video-chat/states/State'],function(State){


  var CallHungUp = function CallHungUp(context){

    var state = new State(context);
    Object.setPrototypeOf(this,state);

    this.constructor = CallHungUp;

    this.callEnabled = false;
    this.pickupToolTip = "Answer";
    this.isCallBtnPanelVisible = true;
    this.isDialogVisible = false;


    this.handleStateUpdate = function(update){

      this.friendStateUpdate(update);
    }
    this.handleStateUpdate = this.handleStateUpdate.bind(this);


    this.update = function(message,subject){
    }

    this.begin = function(){
    }

    this.end = function(){
    }
    this.end = this.end.bind(this);


    this.handleStateQuery = function(query){
      this.emitIamNotAvailableTo(query.senderId);
    }
    this.handleStateQuery = this.handleStateQuery.bind(this);

    /**
     * Ensures that the caller knows that this user is not
     * available at the moment and then queries the state of
     * the current selected friendId.
     */
    this.activate = function(){
      this._context.registerOnStateUpdateCallback(this.handleStateUpdate);
      this._context.registerOnQueryStateCallback(this.handleStateQuery);
      this._context.webRTC.closeConnection();
      this._context.clearLastCallerInfo();
      this._context.tellEveryoneIamAvailable();
    }


    this.deactivate = function(){
      this._context.unregisterOnStateUpdateCallbacks();
      this._context.unregisterOnQueryStateCallbacks();
    }
  }
  return CallHungUp;
});

define('video-chat/states/connected/your-available/call-periphery/CalleeHungUp',['video-chat/states/connected/your-available/call-periphery/_CallPeriphery'],function(CallPeriphery){

  var CalleeHungUp = function CalleeHungUp(context){

    Object.setPrototypeOf(this, new CallPeriphery(context));

    this.constructor = CalleeHungUp;
    this.callEnabled = false;
    this.pickupToolTip = "Answer";
    this.isCallBtnPanelVisible = true;
    this.isDialogVisible = false;

    this.activate = function(){
      Object.getPrototypeOf(this).activate();
      this._context.closeConnection();
      this._context.tellEveryoneIamAvailable();
      this._context.setState("InitialState");
    }
  }
  return CalleeHungUp;
});

define('video-chat/states/connected/your-available/call-periphery/IamCalleeAndHungUp',['video-chat/states/connected/your-available/call-periphery/_CallPeriphery'],function(CallPeriphery){

  var IamCalleeAndHungUp = function IamCalleeAndHungUp(context){

    Object.setPrototypeOf(this, new CallPeriphery(context));

    this.constructor = IamCalleeAndHungUp;
    this.callEnabled = false;
    this.pickupToolTip = "Answer";
    this.isCallBtnPanelVisible = true;
    this.isDialogVisible = false;

    this.activate = function(){
      Object.getPrototypeOf(this).activate();
      this._context.tellTheCallerIHungup();
      this._context.tellEveryoneIamAvailable();
      this._context.closeConnection();
      this._context.setState("InitialState");
    }
  }
  return IamCalleeAndHungUp;
});

define('video-chat/states/connected/your-available/call-periphery/IamCallerAndHungUp',['video-chat/states/connected/your-available/call-periphery/_CallPeriphery'],function(CallPeriphery){

  var IamCallerAndHungUp = function IamCallerAndHungUp(context){

    Object.setPrototypeOf(this, new CallPeriphery(context));

    this.constructor = IamCallerAndHungUp;
    this.callEnabled = false;
    this.pickupToolTip = "Answer";
    this.isCallBtnPanelVisible = true;
    this.isDialogVisible = false;

    this.activate = function(){
      Object.getPrototypeOf(this).activate();
      this._context.tellTheCalleeIHungup();
      this._context.tellEveryoneIamAvailable();
      this._context.closeConnection();
      this._context.setState("InitialState");
    }
  }
  return IamCallerAndHungUp;
});

define('video-chat/states/connected/your-available/call-periphery/AnsweringCall',['video-chat/states/connected/your-available/call-periphery/_CallPeriphery'],function(CallPeriphery){
  var AnsweringCall = function AnsweringCall(context){

    Object.setPrototypeOf(this,new CallPeriphery(context));

    this.constructor = AnsweringCall;
    this.callEnabled = false;
    this.pickupToolTip = "Answer";
    this.isCallBtnPanelVisible = true;
    this.isDialogVisible = true;
    this.isDialogSpinnerVisible = true;
    this.isDialogAnswerButtonsVisible = false;
    this.callerName = "";

    this.handleStateUpdate = function(update){
      Object.getPrototypeOf(this).detectAndHandleHangup(update);
    }
    this.handleStateUpdate = this.handleStateUpdate.bind(this);


    this.update = function(message,subject){
      this.connectionProgress = this.connectionProgress + "\n" + "</div>" +  this.getHumanMessage(message) + "<div>" ;
      this._context.state.valueHasMutated();
      if(message === 'connected'){
       this._context.setState("ConnectedToCaller");
      }
    }

    this.end = function(){
      this._context.setState("IamCalleeAndHungUp");
    }
    this.end = this.end.bind(this);

    this.activate = function(){
      Object.getPrototypeOf(this).activate();
      this._context.registerOnStateUpdateCallback(this.handleStateUpdate);
      this.connectionProgress = '<div>**** Answering Call ****</div>';
      this._context.emitAnswerCall();
    }
    this.activate = this.activate.bind(this);
  }
  return AnsweringCall;
});

define('video-chat/states/NotConnected',['video-chat/states/State'],
function(State){

  var NotConnected = function NotConnected(context){

    Object.setPrototypeOf(this,new State(context));
    this.constructor = NotConnected;
    this.isSpinnerVisible = true;

    this.goToConnectedState = function(){
      this._context.setState("SocketConnected");
    }
    this.goToConnectedState = this.goToConnectedState.bind(this);


    this.goToErrorState = function(){
      this._context.setState('ErrorState');
    }
    this.goToErrorState = this.goToErrorState.bind(this);


    this.activate = function(){
      this._context.registerOnConnectCallBack(this.goToConnectedState);
      this._context.registerOnConnectErrorCallback(this.goToErrorState);
      this._context.closeConnection();
    };

    this.deactivate = function(){

    };


  } // end constructor.


  return NotConnected;
});

define('video-chat/states/connected/SocketConnected',['video-chat/states/State'],
function(State){

  var SocketConnected = function SocketConnected(context){

    Object.setPrototypeOf(this, new State(context));
    this.constructor = SocketConnected;
    this.isSpinnerVisible = true;


    this.onIamAvailableEvent = function(){
      this._context.setState("InitialState");
    }
    this.onIamAvailableEvent = this.onIamAvailableEvent.bind(this);


    this.handleCourseChange = function(){
        this._context.emitJoinCallableGroup();
    }


    this.activate = function(){
       this._context.registerYouAreAvailableCallback(this.onIamAvailableEvent);
    }
    this.activate = this.activate.bind(this);


    this.deactivate = function(){
      this._context.unregisterYouAreAvailableCallbacks();
    }
  }

  return SocketConnected;

});

define('video-chat/states/ErrorState',['video-chat/states/State'],
function(State){

  var ErrorState = function ErrorState(context){

    var state = new State(context);
    Object.setPrototypeOf(this, state);
    this.constructor = ErrorState;
    this.errorMessage = 'This feature is not available at the moment.';

    this.activate = function(){
    }

    this.deactivate = function(){
    }
  }

  return ErrorState;
});


/**
 * The only module that knows about all the possible states.
 */
define('video-chat/StateBuilder',[
'video-chat/states/connected/your-available/call-periphery/call-connected/ConnectedToRecipient',
'video-chat/states/connected/your-available/call-periphery/call-connected/ConnectedToCaller',
'video-chat/states/connected/your-available/call-periphery/call-connected/CallConnected',

'video-chat/states/connected/your-available/InitialState',
'video-chat/states/connected/your-available/NoOneSelected',
'video-chat/states/connected/your-available/FriendIsAvailable',
'video-chat/states/connected/your-available/FriendNotAvailable',

'video-chat/states/connected/your-available/call-periphery/CallingThem',
'video-chat/states/connected/your-available/call-periphery/FriendIsCallingYou',
'video-chat/states/connected/your-available/call-periphery/CallHungUp',
'video-chat/states/connected/your-available/call-periphery/CalleeHungUp',
'video-chat/states/connected/your-available/call-periphery/IamCalleeAndHungUp',
'video-chat/states/connected/your-available/call-periphery/IamCallerAndHungUp',
'video-chat/states/connected/your-available/call-periphery/AnsweringCall',


'video-chat/states/NotConnected',
'video-chat/states/connected/SocketConnected',
'video-chat/states/ErrorState',
],function(
  ConnectedToRecipient,
  ConnectedToCaller,
  CallConnected,
  InitialState,
  NoOneSelected,
  FriendIsAvailable,
  FriendNotAvailable,
  CallingThem,
  FriendIsCallingYou,
  CallHungUp,
  CalleeHungUp,
  IamCalleeAndHungUp,
  IamCallerAndHungUp,
  AnsweringCall,


  NotConnected,
  SocketConnected,
  ErrorState){


  var instances = [];
  var _context = null;


  // returns existing instance if it exists.
  var alreadyMade = function(name){

    var instance = null;
    instances.forEach(function(e){
      if(e.name === name){
        instance = e.instance;
      }
    })
    return instance;
  }







/**
 * Returns a state intance of the given name.
 * All states are singletons.
 * @constructor
 */
  return function StateBuilder(){






      this.build = function(name){

        var instance = alreadyMade(name);
        if(instance){
          return instance;
        }
        switch (name) {

          case "NotConnected":
            var e = new NotConnected(_context);
            instances.push({name:name, instance:e});
            return e;
            break;


          case "SocketConnected":
            var e = new SocketConnected(_context);
            instances.push({name:name,instance:e});
            return e;
            break;

          case "InitialState":
            var e = new InitialState(_context);
            instances.push({name:name,instance:e});
            return e;
            break;

         case "CallHungUp":
          var e = new CallHungUp(_context);
          instances.push({name:name,instance:e});
          return e;
          break;

          case "CalleeHungUp":
          var e = new CalleeHungUp(_context);
          instances.push({name:name, instance:e});
          return e;
          break;


          case "IamCalleeAndHungUp":
          var e = new IamCalleeAndHungUp(_context);
          instances.push({name:name, instance:e});
          return e;
          break;


          case "IamCallerAndHungUp":
          var e = new IamCallerAndHungUp(_context);
          instances.push({name:name, instance:e});
          return e;
          break;

          case "AnsweringCall":
           var e = new AnsweringCall(_context);
           instances.push({name:name,instance:e});
           return e;
           break;

         case "ConnectedToRecipient":
           var e = new ConnectedToRecipient(_context);
           instances.push({name:name, instance:e});
           return e;
           break;

         case "CallConnected":
           var e = new CallConnected(_context);
           instances.push({name:name, instance:e});
           return e;
           break;

         case "ConnectedToCaller":
           var e = new ConnectedToCaller(_context);
           instances.push({name:name, instance:e});
           return e;
           break;

          case "NoOneSelected":
            var e = new NoOneSelected(_context);
            instances.push({name:name, instance:e});
            return e;
            break;

          case "FriendIsAvailable":
              var e = new FriendIsAvailable(_context);
              instances.push({name:name, instance:e});
              return e;
              break;

          case "FriendNotAvailable":
              var e = new FriendNotAvailable(_context);
              instances.push({name:name, instance:e});
              return e;
              break;

          case "CallingThem":
              var e =  new CallingThem(_context);
              instances.push({name:name,instance:e});
              return e;
              break;

          case "FriendIsCallingYou":
              var e =  new FriendIsCallingYou(_context);
              instances.push({name:name, instance:e});
              return e;
              break;

          case "BeingCalledByAnother":
              var e =  new BeingCalledByAnother(_context);
              instances.push({name:name, instance:e});
              return e;
              break;

          case "ErrorState":
            var e = new ErrorState(_context);
            instances.push({name:name, instance:e});
            return e;
            break;


          default:
              throw Error(name + " is not a valid state.");

        }
      }

      this.setContext = function(context) {
        if(!context)
          throw new Error('Context must be defined.');
        else
          _context = context;
      }

      this.getContext = function(){
        return _context;
      }


      this.isInCallState = function(stateName){
        return 'ConnectedToCaller' == stateName || "ConnectedToRecipient" == stateName;
      }



  }

});

define('abstract-interfaces/ObservableSubject',[],function(){


  /**
   * A interface for subjects who want to
   * be observable.  To be a subject
   * the implementor must be a Call related
   * implementor. i.e: issues the states of calls.
   *
   */
  var CallObservable = function(){

    // all this subjects observers.
    this.observers = [];




    this.clearAll = function(){
      this.observers = [];
    }


    /**
     * Used for attaching a new observer
     * to this observable object.
     * @param  {CallObserver} o
     */
    this.attach = function(o){
      // console.log(o);
      if(!o.isObserver || !o.isObserver()){
        throw Error('Can only attach Observers');
      }
      else{
        this.observers.push(o);
      }
    }
    this.attach = this.attach.bind(this);





    /**
     * Removes the given observer from
     * this subjects list of observers.
     * @param  {CallObserver} o [description]
     */
    this.detach = function(o){

      for(var i = 0; i < this.observers.length; i++){
        if(this.observers[i] == o){
          this.observers.splice(i,1);
        }
      }
    }
    this.detach = this.detach.bind(this);





    /**
     * Notifies all the observers of the change.
     * @return {[type]} [description]
     */
    this.notify = function(message){
      this.observers.forEach(function(observer){
        observer.update(message);
      })
    }
    this.notify = this.notify.bind(this);








    /**
     * Returns the number of observers
     * currently attached to this
     * subject.
     * @return {number}
     */
    this.getObserverCount = function(){
      return this.observers.length;
    }





    this.getObservers = function(){

      var observerNames = [];

      for(var i = 0; i < this.getObserverCount(); i++){
        observerNames.push(this.observers[i].getName());
      }
      return observerNames;
    }






  }


  return CallObservable;


})
;
define('video-chat/web-connector/WebRTCEnvironment',['DetectRTC'],
function(DetectRTC){
  var WebRTCEnvironment = function(){

    this._detect = DetectRTC;
    this.callbacks = [];

    this.reg = function(name, callback){
      if(!name || typeof name != 'string'){
        throw new Error('name must be a string.');
      }
      if(!callback || typeof callback != 'function'){
        throw new Error('callback must be a function.');
      }
      this.callbacks.push({
        name:name,
        callback:callback
      });
    }

    this.getCallbackFor = function(name){
      var cbs = this.callbacks;
      for(var i = 0; i < length; i++){
        if(name == cbs[i].name){
          return cbs[i].callback;
        }
      }
    }


    // callback is for dependants of this module.
    // once callback is executed, dependants can
    // start accessing features of this module.
    this.onLoaded = function(){
      for(var i = 0; i < this.callbacks.length; i++){
        var cb = this.callbacks[i];
        var capabilities = this.getCapabilties();
        cb.callback(capabilities);
      }
    }
    this.onLoaded = this.onLoaded.bind(this);
    this._detect.load(this.onLoaded);

    this.getCapabilties = function(){
        var capabilities = {
          hasWebcam:false,
          hasMicrophone:false
        }
        if (this._detect.isWebRTCSupported === false) {
            return capabilities;
        }
        if (this._detect.hasWebcam === false && this._detect.hasMicrophone == true) {
            capabilities.hasMicrophone = true;
        }
        if (this._detect.hasWebcam === true && this._detect.hasMicrophone === false) {
          capabilities.hasWebcam = true;
        }
        if(this._detect.hasWebcam === true && this._detect.hasMicrophone === true){
          capabilities.hasWebcam = true;
          capabilities.hasMicrophone = true;
        }
        return capabilities;
    }



  }

  return WebRTCEnvironment;

});

define('video-chat/web-connector/WebRTC',['abstract-interfaces/ObservableSubject',
'video-chat/web-connector/WebRTCEnvironment'],
function(ObservableSubject,
         WebRTCEnvironment){

var WebRTC  = function(remoteService){

  if(!remoteService || remoteService.getConstructorName() != 'VideoCallRemoteService'){
      throw Error('RemoteService instance must be injected');
  }
  this._remoteService = remoteService;
  this._rtcEnv = new WebRTCEnvironment();



  this.friendsVideo = document.getElementById("remoteVideo");
  /**
   * Note that the stun servers are the ones that just relay IP
   * info between peers.   TURN servers are the ones that can relay
   * the actual audio video data if P2P isn't possible.
   */
  this.RTCConfiguration = {
      iceServers: [],
      iceTransportPolicy:'all'
  }


  this.getIceTransportPolicy = function(){
    return this.RTCConfiguration.iceTransportPolicy;
  }

  this.setIceTransportPolicy = function(policy){
    if(!policy || policy != 'all' && policy != 'relay'){
      throw new Error('Policy must be "all" or "relay"');
    }
    this.RTCConfiguration.iceTransportPolicy = policy;
  }

  this.addStunServer = function(url){
    this.RTCConfiguration.iceServers.push({url:'stun:' + url});
  }

  this.addTurnServer = function(url,credential, username){
    if(!url || !credential || !username){
      throw new Error("Turn server requires url, credential and username!");
    }
    this.RTCConfiguration.iceServers.push({
             url:"turn:" + url,
             credential: credential, // NOT Hash (public)
             username: username})
  }


  this.addStunServer('stun.l.google.com:19302');
  this.addStunServer('stun1.l.google.com:19302');
  this.addStunServer('stun2.l.google.com:19302');
  this.addStunServer('stun.l.google.com:19302');
  this.addStunServer('stun.services.mozilla.com');
  this.addTurnServer("www.turn.palolo.ca?transport=tcp",'devpassword','chris');



  // instances of WebtRTC are observable.
  Object.setPrototypeOf(this,new ObservableSubject());
  this.getConstructorName = function(){
    return "WebRTC";
  }


  this.streamConstraints = {
      video: true,
      audio: true
  };

  this.isVideoAvailable = function(){
    var sc = this.streamConstraints;
    if(sc.video == true){
      return true;
    }
    else{
      return false;
    }
  }

  // Sets the media constraints given the capabilities
  // of the current device.  i.e: if there is no
  // webcam but there is a microphone then only the audio
  // constraint will be true.
  this.setMediaContraints = function(capabilities){
    var c = capabilities;

    if(!c.hasWebcam){
      this.streamConstraints.video = false;
    }
    else{
      this.streamConstraints.video = true;
    }
    if(!c.hasMicrophone){
      this.streamConstraints.audio = false;
    }
    else{
      this.streamConstraints.audio = true;
    }
  }
  this.setMediaContraints = this.setMediaContraints.bind(this);
  this._rtcEnv.reg('onLoad',this.setMediaContraints);


  /**
   * @override attach so that only one observer can  occupy the observers list  at a time.
   * @param  observer
   */
  this.attachObserver = function(observer){

    var proto = Object.getPrototypeOf(this);
    if(this.getObserverCount() < 1){
      proto.attach(observer);
    }else{
      proto.observers.pop();
      proto.attach(observer);
    }
  }



  this.detachObserver = function(observer){
    var proto = Object.getPrototypeOf(this);
    proto.detach(observer);
  }




  this.onAddFriendsMediaStream = function(event) {
    var mediaStream = event.stream;
    this.setupBigVideo(mediaStream);
    this.setupTinyVideo(mediaStream);
  }
  this.onAddFriendsMediaStream = this.onAddFriendsMediaStream.bind(this);

  this.setupBigVideo = function(mediaStream){
    if(!this.friendsVideo){
      this.friendsVideo = document.getElementById("big-video");
    }
    this.friendsVideo.srcObject = mediaStream;
  }

  this.setupTinyVideo = function(mediaStream){
    if(!this.tinyVideo){
      this.tinyVideo = document.getElementById('tiny-video');
    }
    if(!this.tinyVideo){
      throw new Error('video element is missing or misnamed!');
    }
    this.tinyVideo.srcObject = mediaStream;
  }





  this.setLocalDecription = function(sessionDescription) {
      var promise = this.peerConnection.setLocalDescription(sessionDescription);
      promise.catch(err =>{
        this.notify("There was a problem setting the local description: " + err,this);
      })
      return promise;
  }
  this.setLocalDecription = this.setLocalDecription.bind(this);






  this.setupLocalVideoToSeeYourSelf = function(stream){
    if(!this.localVideo){
      this.localVideo = document.getElementById("localVideo");
    }
    this.localVideo.srcObject = stream;
  }




  this.attemptToCreateNewPeerConnection = function(testMode) {
    try{
      if(!this.peerConnection){

        this.peerConnection = this.getNewRTCPeerConnection();
        this.peerConnection.onicecandidate = this.sendIceCandidateToFriend;
        this.peerConnection.onaddstream = this.onAddFriendsMediaStream;

        if(!testMode){
              this.peerConnection.addStream(this.localMediaStream); // adds  localstream.
        }

        this.peerConnection.oniceconnectionstatechange = this.onStateChange;
        this.peerConnection.onconnectionstatechange = this.onStateChange;
        // this.peerConnection.onnegotiationneeded = this.handleRenegotiationNeeded;
      }
    }
    catch(err){
      alert(err.message);
    }
  }
  this.attemptToCreateNewPeerConnection = this.attemptToCreateNewPeerConnection.bind(this);


  this.getNewRTCPeerConnection = function(){
    // console.log(RTCPeerConnection);
    if(!RTCPeerConnection){
      throw new Error("Your browser does not support video calls, please upgrade your browser to the latest version.");
    }
    return new RTCPeerConnection(this.RTCConfiguration);
  }
  this.getNewRTCPeerConnection = this.getNewRTCPeerConnection.bind(this);


  /**
   * Handles the changes to the WebRTC connection.
   * e.g: the state goes from cchecking to connected,
   * we want to let out observers (our subscribers to know
   * about the cahnges).
   *
   * @param  {object} state
   */
this.onStateChange = function(event){
    if(this.peerConnection){
      var message = event.target.iceConnectionState;
      // console.log("webRTC:" + message);
      this.notify(message, this);
      if(message == 'closed'){
        this.peerConnection = null;
      }
    }
  }
  this.onStateChange = this.onStateChange.bind(this);


  this.callerSaveRoomIdAndSetupLocalMediaStream = function (room) {
      this.roomId = room;
      var constraints = this.streamConstraints;
      var onReady = this.onCallerMediaStreamReady;
      var onError = this.onCallerMediaStreamReadyError;
      this.startMediaStream(constraints, onReady, onError);
  }
  this.callerSaveRoomIdAndSetupLocalMediaStream = this.callerSaveRoomIdAndSetupLocalMediaStream.bind(this);


  this.onCallerMediaStreamReady = function(stream){
    this.localMediaStream = stream;
    this.notify("Local media stream created..", this);
  }
  this.onCallerMediaStreamReady = this.onCallerMediaStreamReady.bind(this);

  this.onCallerMediaStreamReadyError = function (err) {

      var permissionError = new RegExp('NotAllowedError');
      var notAvailable = new RegExp('NotFoundError');
      var notReadable = new RegExp('NotReadableError');
      if(permissionError.test(err)){
        alert('Please change your browsers permissions to allow access to the your webcamera.');
      }
      else if(notAvailable.test(err)){
          // console.log(err.toString());
        alert("Cannot make call because there is no web camera detected.");
      }
      else if(notReadable.test(err)){
        alert('Webcamera cannot connect.  Please make sure your webcamera is not being used by another application.');
      }
      else{
        this.notify('An error ocurred when accessing your media devices: ' + err, this);
      }
  }
  this.onCallerMediaStreamReadyError = this.onCallerMediaStreamReadyError.bind(this);




//  RECIPIENT STUFF    FRIEND IS CALLING YOU.


  /**
   * Handles what happens after the callee answers the call
   * and joins the call room.  i.e It initializes
   * the mediaStream (video or audio)
   * @param  {Number} roomId unique identifier for the call room.
   */
  this.recipientSaveIdAndSetupLocalMediaStreamAndSayReady = function (roomId) {
    this.roomId = roomId;
    // console.log("call room received: " + roomId);
    var constraints = this.streamConstraints;
    var onReady = this.onRecipientMediaStreamReady;
    var onError = this.onRecipientMediaStreamReadyError;
    this.startMediaStream(constraints, onReady, onError);
  }
  this.recipientSaveIdAndSetupLocalMediaStreamAndSayReady = this.recipientSaveIdAndSetupLocalMediaStreamAndSayReady.bind(this);

  this.onRecipientMediaStreamReady = function(stream){
      this.localMediaStream = stream;
      this.notify('Local media stream is set and ready..', this);
      this._remoteService.emitIamReadyToCaller(this.roomId);
  }
  this.onRecipientMediaStreamReady= this.onRecipientMediaStreamReady.bind(this);



  this.startMediaStream = function(constraints, onReady, onError){
    try{
      var nav = window.navigator;
      var errorMessage = 'Calling is not supported by your browser. Please upgrade your browser.';
      if(!nav){
        throw new Error(errorMessage);
      }
      var mediaDevices = nav.mediaDevices;
      if(!mediaDevices){
        throw new Error(errorMessage);
      }
      var getUserMedia = mediaDevices.getUserMedia;
      if(!getUserMedia || typeof getUserMedia != 'function'){
        throw new Error(errorMessage);
      }
      mediaDevices.getUserMedia(constraints).then(onReady).catch(onError);
    }
    catch(err){
      alert(err.message);
    }
  }
  this.startMediaStream = this.startMediaStream.bind(this);


  this.onRecipientMediaStreamReadyError = function(err){
    var permissionRegex = new RegExp('NotAllowed');
    var notReadableRegex = new RegExp('NotReadableError');
    var notFoundRegex = new RegExp('NotFound');
    if(permissionRegex.test(err)){
      alert("Please change your browsers permissions to allow the webcamera to work.");
    }
    else if(notFoundRegex.test(err)){
      // console.log(err.toString());
      alert("Call cannot work because no webcamera was found.");
    }
    else if(notReadableRegex.test(err)){
      alert("Webcamera cannot connect.  Please check no other application is using the webcamera.");
    }
    else{
      var message = "There was an error connecting, \n\n please contact Palolo support at 905-808-8791."
                  + "error info: " + err;
      this.notify(message, this);
    }
  }
  this.onRecipientMediaStreamReadyError = this.onRecipientMediaStreamReadyError.bind(this);




// BOTH USERS


this.sendOfferToRecipient = function () {
  // console.log("Recipient says their ready, sending description to recipient.");
      this.notify("Sending session desciption offer to recipient..",this);
      this.attemptToCreateNewPeerConnection();
      let offerOptions = {
          offerToReceiveAudio: 1
      }
      this.peerConnection
          .createOffer(offerOptions)
          .then(this.onOfferCreated)
          .catch(function(err){
            console.log("There was an error creating the offer");
            console.log(err);
          });

  }
  this.sendOfferToRecipient = this.sendOfferToRecipient.bind(this);



  this.onOfferCreated = function(sessionDescription) {

    return this.setLocalDecription(sessionDescription)
        .then(()=>{
          this.notify("Sending session description offer..",this);

          this._remoteService.emitOfferForRecipient( {
              type: 'offer',
              sdp: sessionDescription,
              room: this.roomId
          });
        });
  }
  this.onOfferCreated = this.onOfferCreated.bind(this);




  this.sendAnswerToCaller = function (event) {
      this.notify("Offer received, sending an answer..", this);
      var description = new RTCSessionDescription(event);
      this.attemptToCreateNewPeerConnection();
      this.peerConnection.setRemoteDescription(description);
      this.peerConnection.createAnswer()
          .then(this.onAnswerCreated)
          .catch(e => console.log(e));
  }
  this.sendAnswerToCaller = this.sendAnswerToCaller.bind(this);


    this.onAnswerCreated = function(sessionDescription){
      return this.setLocalDecription(sessionDescription)
          .then(()=>{
            this.notify("Sending session description answer..",this);
            this._remoteService.emitAnswerToCaller({
                type: 'answer',
                sdp: sessionDescription,
                room: this.roomId
            })
          })
    }
    this.onAnswerCreated = this.onAnswerCreated.bind(this);




    this.setRecipientsSessionDescription = function (event) {
        this.notify("Answer received, setting remote session description of peer.");
        var desc = new RTCSessionDescription(event);
        this.peerConnection.setRemoteDescription(desc);
    }
    this.setRecipientsSessionDescription = this.setRecipientsSessionDescription.bind(this);




    this.sendIceCandidateToFriend = function(event) {
        if(!this.peerConnection){
          throw new Error('peerConnection must be initialized before sending ice candidates.');
        }
        if (event.candidate) {
          var startIndex = event.candidate.candidate.indexOf("typ");
          var candidateType = event.candidate.candidate.substring(startIndex + 4,startIndex + 10);
          this.notify("Sending ice candidate of type: " + candidateType, this);
          this._remoteService.emitCandidate(this.buildCandidateFromEvent(event));
        }
        else{
          // for Microsoft Edge. (requires calling null)
          // https://stackoverflow.com/questions/51495599/timeout-for-addremotecandidate-consider-sending-an-end-of-candidates-notificati
          this.peerConnection.addIceCandidate(null); // adapter-latest ignores this!
        }
    }
    this.sendIceCandidateToFriend = this.sendIceCandidateToFriend.bind(this);





    /**
     * Takes the ice candidate event generated by the rtcPeerConnection
     * and makes something that can be sent to the peer.
     * @param  {[type]} event [description]
     * @return {object}
     */
    this.buildCandidateFromEvent = function(event){
      return {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: this.roomId
        }
    }
    this.buildCandidateFromEvent = this.buildCandidateFromEvent.bind(this);




    this.handleIceCandidate = function (event) {
      this.notify("Ice candidate received..",this);
      var candidate = new RTCIceCandidate({
          sdpMLineIndex: event.label,
          candidate: event.candidate
      });
      this.peerConnection.addIceCandidate(candidate);
    }
    this.handleIceCandidate = this.handleIceCandidate.bind(this);


    /**
     * To be called when iceConnectionState goes to 'failure'
     * to attempt to reconnect.
     */
    this.restartNegotiation = function(){
      var newSessionDescription = null;
      this.peerConnection.createOffer({iceRestart:true})
          .then((desc)=>{
            newSessionDescription = desc;
            return this.setLocalDecription(desc);
          })
          .then(()=>{
              this.notify("Renegotiating connection..",this);
              // console.log(newSessionDescription);
              // send offer to server.
              this._remoteService.emitOfferForRecipient( {
                  type: 'offer',
                  sdp: newSessionDescription,
                  room: this.roomId
              });
          })
    }



  /**
   * Closes the current connection if it exists.
   * and closes the local media stream.
   */
  this.closeConnection = function(){
    this.notify('Closing connection..',this);
    if(this.peerConnection){
        this.peerConnection.close();
    }
    this.closeLocalMediaStreams();
    // this.peerConnection = null;
  } // end fn.
this.closeConnection = this.closeConnection.bind(this);


  /**
   * Closes all the media tracks (audo and video).
   */
  this.closeLocalMediaStreams = function(){

    if(typeof this.localMediaStream == 'object'){
      var tracks = this.localMediaStream.getTracks();
      for(var i = 0; i < tracks.length; i++){
        var track = tracks[i];
        track.stop();
      }
    }
    else{
      console.log("Error: Local Media Stream is not available.");
    }
  }
  this.closeLocalMediaStreams = this.closeLocalMediaStreams.bind(this);


  this._remoteService.registerOnJoinedCallRoom(this.recipientSaveIdAndSetupLocalMediaStreamAndSayReady); // recipient.
  this._remoteService.registerOnCallRoomCreated(this.callerSaveRoomIdAndSetupLocalMediaStream); //caller.
  this._remoteService.registerOnRecipientReady(this.sendOfferToRecipient); // caller
  this._remoteService.registerOnOfferFromCaller(this.sendAnswerToCaller); // recipient
  this._remoteService.registerOnAnswerFromRecipient(this.setRecipientsSessionDescription); // caller
  this._remoteService.registerOnCandidate(this.handleIceCandidate); // both
} // end constructor.


  WebRTC.getInstance = function(remoteService){
    return new WebRTC(remoteService);
  }

return WebRTC;
}); // end define.
;
define('video-chat/TestObservable',
['abstract-interfaces/ObservableSubject'],
function(ObservableSubject){

/**
 * Used for sending "fake" signals to parts of
 * the system to simulate certain call situations
 * such as failed called or disconnects.

 */
var TestObservable  = function(){

  // instances of WebtRTC are observable.
  Object.setPrototypeOf(this,new ObservableSubject());


  this.notifyFailure = function(){
    this.notify('failed');
  }


} // end constructor.



return TestObservable;


}); // end define.
;
define('video-chat/VideoCallRemoteService',['ActiveRemoteService',
        'socketio',
        'video-chat/web-connector/WebRTC'],
function(ActiveRemoteService,
         io,
         WebRTC){

  var VideoCallRemoteService = function(){

    Object.setPrototypeOf(this,new ActiveRemoteService());
    this.setMicroServer("live");

    this.constructor = VideoCallRemoteService;
    this.getConstructorName = function(){
      return "VideoCallRemoteService";
    }
    this._io = io;
    this.webRTC = null;




    /**
     * @throws if invoked and the access token either does not exist or
     *         is the empty string.
     * @postcondtion _socket will be initialized but not connected
     *              webRTC will be initialized
     *              callback for initWebRTC will be registered.
     */
    this.initSocket = function(){
      var accessToken = this.getAccessToken();
      if(!accessToken || accessToken.length <= 0){
        throw new Error("initSocket expects accessToken to be a non-empty string.");
      }

      this._socket = this._io(this.getServerURL(),{
        autoConnect:false,
        reconnection:false,
        query: {token: accessToken}
      });
    }
    this.initSocket = this.initSocket.bind(this);



    this.connectSocket = function(callback){
      if(this._socket && this._socket.connected != true){
        this._socket.connect();
      }
      if(callback){
        callback(this._socket);
      }
    }


    this.disconnectSocket = function(){
      if(this._socket)
        this._socket.disconnect();
    }

    this.getOnConnectCallbacks = function(){
      return this._socket._callbacks.$connect;
    }

    this.getOnErrorCallbacks = function(){
      return this._socket._callbacks.$connect_error;
    }

    this.getOnBeingCalledCallbacks = function(){
      return this._getCallbacksFor('yourBeingCalled');
    }

    this.getOnStateUpdateCallbacks = function(){
      return this._getCallbacksFor('stateUpdate');
    }

    this.getOnQueryStateCallbacks = function(){
      return this._getCallbacksFor('stateQuery');
    }

    this.getYouAreAvailableCallbacks = function(){
      return this._getCallbacksFor('youAreAvailable');
    }

    this._getCallbacksFor = function(eventName){

      var dollaredEventName = "$" + eventName; // because socketio adds $ as a prefix.
      if(!this._socket._callbacks[dollaredEventName]){
        return [];
      }
      else{
        return this._socket._callbacks[dollaredEventName];
      }
    }






 // Registers
  this.registerOnConnectCallBack = function(callback){
    this._socket.on('connect',callback);
  }


  this.registerOnUserId = function(callback){

    this._socket.on('userId', callback);
  }


  this.registerOnDisconnect = function(fn){
    this._socket.on('disconnect',fn);
  }

  this.registerOnConnectErrorCallback = function(callback){
    this._socket.on('connect_error',callback);
  }

  this.registerOnErrorCallback = function(callback){
    this._socket.on('remote_error', callback);
  }

  this.registerOnBeingCalledCallback = function(callback){
      this._socket.on('yourBeingCalled',callback);
  }

  this.registerOnStateUpdateCallback = function(callback){
    this._socket.on('stateUpdate',callback);
  }

  this.registerYouAreAvailableCallback = function(callback){
    this._socket.on('youAreAvailable', callback);
  }

  this.registerOnQueryStateCallback = function(callback){

    this._socket.on('stateQuery',callback);
  }


// webRTC registers.

  this.registerOnCallRoomCreated = function(fn){
    this._socket.on('callRoomCreated',fn);
  }
  this.registerOnCallRoomCreated = this.registerOnCallRoomCreated.bind(this);


  this.registerOnJoinedCallRoom = function(fn){
    this._socket.on('joinedCallRoom',fn);
  }
  this.registerOnJoinedCallRoom = this.registerOnJoinedCallRoom.bind(this);


  this.registerOnRecipientReady = function(fn){
    this._socket.on('recipientReady',fn);
  }
  this.registerOnRecipientReady = this.registerOnRecipientReady.bind(this);


  this.registerOnOfferFromCaller = function(fn){
    this._socket.on('offerFromCaller',fn);
  }
  this.registerOnOfferFromCaller = this.registerOnOfferFromCaller.bind(this);


  this.registerOnAnswerFromRecipient = function(fn){
    this._socket.on('answerFromRecipient',fn);
  }
  this.registerOnAnswerFromRecipient = this.registerOnAnswerFromRecipient.bind(this);


  this.registerOnCandidate = function(fn){
    this._socket.on('candidate',fn);
  }
  this.registerOnCandidate = this.registerOnCandidate.bind(this);






  // unregisters

    this.unregisterOnBeingCalledCallbacks = function(){
      this._socket.removeListener('yourBeingCalled');
    }

    this.unregisterOnStateUpdateCallbacks =function(){
      this._socket.removeListener('stateUpdate');
    }

    this.unregisterOnQueryStateCallbacks = function(){
      this._socket.removeListener('stateQuery');
    }

    this.unregisterYouAreAvailableCallbacks = function(){
      this._socket.removeListener('youAreAvailable');
    }



 this.emitIamNotAvailable = function(){
   this._socket.emit('stateUpdate',"IamNotAvailable");
 }

  this.tellEveryoneIamAvailable = function(){
    this._socket.emit("stateUpdate","IamAvailable");
  }



  this.emitIamAvailableTo = function(recipientId){
    this.emitDirectStateUpdate("IamAvailable",recipientId);
  }

  this.emitIamNotAvailableTo = function(recipientId){
    this.emitDirectStateUpdate("IamNotAvailable",recipientId);
  }

  this.emitJoinCallableGroup = function(groupId){
    if(isNaN(groupId) || groupId <= 0){
      throw new Error('Invalid groupId');
    }
    this._socket.emit("joinCallableGroup", groupId);
  }
  this.emitJoinCallableGroup = this.emitJoinCallableGroup.bind(this);

  this.emitCallThem = function(recipientId){
    if(isNaN(recipientId) || recipientId <= 0){
      throw new Error('recipientId must be a positive integer.');
    }
    this._socket.emit('callThem',recipientId);
  }

  this.tellTheCallerIamAvailable = function(recipientId){
    this.emitDirectStateUpdate('IamAvailable',recipientId);
  }

  this.tellTheCallerIHungup = function(recipientId){
    this.emitDirectStateUpdate('IamCalleeAndHungUp',recipientId);
  }

  this.tellTheCalleeIHungup = function(recipientId){
    this.emitDirectStateUpdate('IamCallerAndHungUp', recipientId);
  }

  this.emitDirectStateUpdate = function(state,recipientId){
    this._isValidUserId(recipientId);
    this._socket.emit('directStateUpdate',{
      state:state,
      recipientId:recipientId
    });
  }

  this.emitAnswerCall = function(callerId){
    this._isValidUserId(callerId);
    this._socket.emit('answerCall',callerId);
  }

  this.emitFriendStateQuery = function(friendId){
    this._isValidUserId(friendId);
    this._socket.emit('stateQuery',{recipientId:friendId});
  }

  this.emitCallStarted = function(callerId){
    this._isValidUserId(callerId);
    this._socket.emit('callStarted',callerId);

  }
  this.emitCallEnded = function(callerId){
    this._isValidUserId(callerId);
    this._socket.emit('callEnded',callerId);
  }


  // webRTC emitters.

  this.emitIamReadyToCaller = function(roomId){
    this._socket.emit('recipientReady',roomId);
  }
  this.emitIamReadyToCaller = this.emitIamReadyToCaller.bind(this);

  this.emitOfferForRecipient = function(offer){
    this._socket.emit('offerForRecipient',offer);
  }

  this.emitAnswerToCaller = function(answer){
    this._socket.emit('answerToCaller',answer);
  }

  this.emitCandidate = function(candidate){
      this._socket.emit('candidate', candidate);
  }



  this._isValidUserId = function(userId){
    if(isNaN(userId) || userId < 1){
      throw new Error("userId must be a positive integer.");
    }
  }
} // end constructor.



return VideoCallRemoteService;


}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('right-panel/video-chat/Component',[
  'ko',
  'socketio',
  'postbox',
  'video-chat/states/State',
  'text!video-chat/template.html',
  'video-chat/StateBuilder',
  'video-chat/web-connector/WebRTC',
  'adapter',
  'video-chat/TestObservable',
  'video-chat/VideoCallRemoteService',
  'dispatcher/Dispatcher',
  'people-models/Person'
],function(
  ko,
  io,
  postbox,
  friendState,
  template,
  StateBuilder,
  WebRTC,
  adapter,
  TestObservable,
  VideoCallRemoteService,
  Dispatcher,
  Person
){

function VoiceViewModel(params, componentInfo){

  this.store = this;
  this.webRTC = null;
  this.WebRTC = WebRTC;
  this._dispatcher = new Dispatcher();
  this.manualTestHarness = new TestObservable();
  this.remoteService = new VideoCallRemoteService();
  this.builder = new StateBuilder();
  this.builder.setContext(this);

  this.authState = ko.observable('anonymous');
  this.currentSelectedClassmateId = ko.observable(null);
  this.selectedCourse = ko.observable(null);
  this.state = ko.observable(null);
  this.previousState = ko.observable(null);
  this.connectedClassmateId = -1;
  this.isTinyVideoVisible = ko.observable(false);
  this.isLargeVideoVisible = ko.observable(false);


  this.reconnectCall = function(){
    this._webRTC.restartNegotiation();
  }

  this.getCurrentSelectedClassmateId = function(){
    return this.currentSelectedClassmateId();
  }

  this.getConnectedClassmateId = function(){
    return this.connectedClassmateId;
  }

  this.setConnectedClassmateId = function(id){
    this.connectedClassmateId = id;
  }
  this.setConnectedClassmateId = this.setConnectedClassmateId.bind(this);


  this.eraseConnectedClassmateId = function(){
    this.connectedClassmateId = -1;
  }

  this.getLastCallRecipientId = function(){
    return this.lastCallRecipientId;
  }

  this.setLastCallRecipientId = function(id){
    this.lastCallRecipientId = id;
  }


  this.getSelectedCourseId = function(){
    if(this.selectedCourse() == null){
      return -1;
    }
    else{
      return this.selectedCourse().getId();
    }
  }

  this.setLastCallerInfo = function(info){

    if(!info.first || typeof info.first != 'string'){
      throw new Error('Caller must have their first name.');
    }
    if(!info.last || typeof info.last != 'string'){
      throw new Error('Caller must have their last name.');
    }
    if(isNaN(info.id) || info.id <= 0){
      throw new Error("Call must have a positive integer as their id.");
    }

    if(info.large_photo_url){
      info.large_photo_url = this.remoteService.getServerURL() + '/' + info.large_photo_url;
    }

    this.lastCallerInfo = info;
  }

  this.getLastCallerInfo = function(){
    return this.lastCallerInfo;
  }

  this.clearLastCallerInfo = function(){
    this.lastCallerInfo = null;
  }

  this.attachManualTestHarness = function(){
    if(typeof this.state === 'function'){
      this.manualTestHarness.attach(this.state());
    }
  }
  this.attachManualTestHarness = this.attachManualTestHarness.bind(this);


  this.detachManualTestHarness = function(){
    if(typeof this.state == 'function'){
      this.manualTestHarness.detach(this.state());
    }
  }


  this.simulateFailedWebRTCConnection = function(){
    this.manualTestHarness.notifyFailure();
  }
  this.simulateFailedWebRTCConnection = this.simulateFailedWebRTCConnection.bind(this);


  this.setState = function(name, info){
    if(typeof this.state == "function" && this.webRTC){

      // deactivate previous state.
      var previousState = this.getState();
      this.previousState(previousState);
      previousState.deactivate();
      this.webRTC.detach(previousState);

      // activate new state.
      var newState = this.builder.build(name);
      this.webRTC.attachObserver(newState);
      newState.activate();
      this.state(newState);
      this.state.valueHasMutated();
    }
    else{
      var state = this.builder.build('NotConnected');
      this.state(state);
    }
  } // end fn.
  this.setState("NotConnected");



this.getState = function(){
  return this.state();
}

  /**
   */
  this.setPreviousState = function(){
    if(!this.previousState()){
      this.previousState(null);
    }
    else{
      this.setState(this.previousState().constructor.name);
    }
  }
  this.setPreviousState("NotConnected");




  this.onAuth = function(update, callback){
      if(update.state == 'authenticated'){
        this.remoteService.initSocket();
        this.remoteService.connectSocket(function(){});
        this.remoteService.registerOnDisconnect(this.onSocketDisconnect);
        this.remoteService.registerOnErrorCallback(this.onRemoteServiceError);
        this.webRTC = this.WebRTC.getInstance(this.remoteService);
        this._dispatcher.reg('focusPerson',this.setCurrentClassmateInfo);
        this.authState(update.state);
      }
      else{
        this.setState("NotConnected");
      }

      if(callback)
        callback(true);
  }
  this.onAuth = this.onAuth.bind(this);
  this._dispatcher.reg('authState', this.onAuth);


  this.setCurrentClassmateInfo = function(classmate){

    if(classmate == null){
      this.currentSelectedClassmateId(null);
      return;
    }
    var constructorName = classmate.getConstructorName();
    if(constructorName != 'Person' && constructorName != 'NullPerson'){
      throw new Error("classmate must be an instance of Person");
    }
    else if(typeof this.state == 'function'){
      var id = classmate.getId();
      this.currentSelectedClassmateId(id);
      this.state().onFriendIdChange();
      this.possiblyResizeVideo();
    }
  }
  this.setCurrentClassmateInfo = this.setCurrentClassmateInfo.bind(this);


  this.possiblyResizeVideo = function(){
    var connectedClassmateId = this.connectedClassmateId;
    var selectedClassmateId = this.currentSelectedClassmateId();
    if(connectedClassmateId > 0){
      if(connectedClassmateId != selectedClassmateId){
        this.isTinyVideoVisible(true);
        this.isLargeVideoVisible(false);
      }
      else{
        this.isTinyVideoVisible(false);
        this.isLargeVideoVisible(true);
      }
    }
  }





  this.closeConnection = function(){
    this.webRTC.closeConnection();
  }




  this.registerOnConnectCallBack = function(callback){
    this.remoteService.registerOnConnectCallBack(callback);
  }

  this.registerOnConnectErrorCallback = function(callback){
    this.remoteService.registerOnConnectErrorCallback(callback);
  }

  this.registerOnStateUpdateCallback = function(callback){
    this.remoteService.registerOnStateUpdateCallback(callback);
  }

  this.unregisterOnStateUpdateCallbacks = function(){
    this.remoteService.unregisterOnStateUpdateCallbacks();
  }

  this.registerOnQueryStateCallback = function(callback){
    this.remoteService.registerOnQueryStateCallback(callback);
  }

  this.unregisterOnQueryStateCallbacks = function(){
    this.remoteService.unregisterOnQueryStateCallbacks();
  }

  this.unregisterOnQueryStateCallbacks = function(){
    this.remoteService.unregisterOnQueryStateCallbacks();
  }

  this.registerYouAreAvailableCallback = function(fn){
    this.remoteService.registerYouAreAvailableCallback(fn);
  }

  this.tellTheCallerIHungup = function(){
    var callerId = this.getLastCallerInfo().id;
    this.remoteService.tellTheCallerIHungup(callerId);
  }

  this.tellTheCallerIamAvailable = function(){
    var callerId = this.getLastCallerInfo().id;
    this.remoteService.tellTheCallerIamAvailable(callerId);
  }

  this.tellTheCalleeIHungup = function(){
    var calleeId = this.getLastCallRecipientId();
    this.remoteService.tellTheCalleeIHungup(calleeId);
  }

  this.emitJoinCallableGroup = function(){
    var courseId = this.selectedCourse().getId();
    this.remoteService.emitJoinCallableGroup(courseId);
  }
  this.emitJoinCallableGroup = this.emitJoinCallableGroup.bind(this);

  this.onCourseInfo = function(info){
    if(info.getConstructorName() == 'CourseGroup'){
      this.selectedCourse(info);
      this.state().handleCourseChange();
    }
  }
  this.onCourseInfo = this.onCourseInfo.bind(this);
  this._dispatcher.reg('groupInfo', this.onCourseInfo);

  this.emitIamNotAvailableTo = function(recipientId){
    this.remoteService.emitIamNotAvailableTo(recipientId);
  }

  this.emitIamAvailableTo = function(recipientId){
    this.remoteService.emitIamAvailableTo(recipientId);
  }

  this.tellEveryoneIamAvailable = function(){
    this.remoteService.tellEveryoneIamAvailable();
  }

  this.emitFriendStateQuery = function(friendId){
    this.remoteService.emitFriendStateQuery(friendId);
  }

  this.emitCallThem = function(){
    var id = this.currentSelectedClassmateId();
    this.remoteService.emitCallThem(id);
  }

  this.emitAnswerCall = function(){
    var id = this.getLastCallerInfo().id;
    this.remoteService.emitAnswerCall(id);
  }

  this.emitCallStarted = function(){
    var id = this.getLastCallerInfo().id;
    this.remoteService.emitCallStarted(id);
  }

  this.emitCallEnded = function(){
    var id = this.getLastCallerInfo().id;
    this.remoteService.emitCallEnded(id);
  }



  this.disconnectSocket = function(){
    this.remoteService.disconnectSocket();
  }


  this.registerOnBeingCalledCallback = function(fn){
    this.remoteService.registerOnBeingCalledCallback(fn);
  }

  this.unregisterOnBeingCalledCallbacks = function(){
    this.remoteService.unregisterOnBeingCalledCallbacks();
  }

  this.unregisterYouAreAvailableCallbacks = function(){
    this.remoteService.unregisterYouAreAvailableCallbacks();
  }


  this.isActive = function(){
    var authenticated = this.authState() === 'authenticated';
    var classmateId = this.currentSelectedClassmateId();
    var isValidFriendId = classmateId != null && classmateId > 0;
    var isCourseSelected = this.selectedCourse() != null && this.selectedCourse().getId() > 0;
    return authenticated && isValidFriendId || authenticated && isCourseSelected;
  }
  this.isVisible = ko.computed(this.isActive,this);


  /**
   * Returns the name of the current
   * states constructor.
   */
  this.getStateName = function(){
    try{
      return this.state().constructor.name;
    }
    catch(e){
      return "InvalidState";
    }
  }

  this.onRemoteServiceError = function(error){
    console.log("RemoteServerError:" + error);
    this.setState('ErrorState');
  }
  this.onRemoteServiceError = this.onRemoteServiceError.bind(this);






  this.onSocketDisconnect = function(){
    this.setState('NotConnected');
  }
  this.onSocketDisconnect = this.onSocketDisconnect.bind(this);


  /**
    requires connectedClassmateId to be set before hand.
  */
  this.emitVideoState = function(){
      var classmateId = this.getConnectedClassmateId();
      var isVideoAvailable = this.webRTC.isVideoAvailable();
      if(!classmateId  || isNaN(classmateId) || classmateId < 1 || isVideoAvailable == false){
        this._dispatcher.dispatch('videoStateUpdate',{
          isOn:false,
          classmateId:classmateId
        });
      }
      else{
        this._dispatcher.dispatch('videoStateUpdate',{
          isOn:true,
          classmateId:classmateId
        });
      }
  }
  this.emitVideoState = this.emitVideoState.bind(this);
  this._dispatcher.reg('videoStateQuery',this.emitVideoState);



  this.onCourseSelected = function(isSelected){

    if(isSelected){
      var isVideoAvailable = this.webRTC.isVideoAvailable();
      var connectedClassmateId = this.getConnectedClassmateId();
      if(isVideoAvailable && connectedClassmateId > 0){
        this.isTinyVideoVisible(true);
        this.isLargeVideoVisible(false);
      }
    }
  }
  this.onCourseSelected = this.onCourseSelected.bind(this);
  this._dispatcher.reg('courseSelected', this.onCourseSelected);


  this.callButtonPressed = function(){
    this.state().begin();
  }
  this.callButtonPressed = this.callButtonPressed.bind(this);
  this.callButtonPressedId = this._dispatcher.reg('callButtonPressed',this.callButtonPressed);


  this.hangupButtonPressed = function(){
    this.state().end();
  }
  this.hangupButtonPressed = this.hangupButtonPressed.bind(this);
  this._dispatcher.reg('hangupButtonPressed', this.hangupButtonPressed);


  this.computeCallerInfo = function(){
    // Needs to be called for the computed observable to work properly.
    var state = this.state();
    if(this.getLastCallerInfo()){
      var info = {
        photoURL: this.getLastCallerInfo().large_photo_url,
        name: this.getLastCallerInfo().first + ' ' + this.getLastCallerInfo().last,
      }
      return info;
    }
    return "Caller info not set.";
  }
  this.callerInfo = ko.computed(this.computeCallerInfo,this);


  this.startRingingSound = function(){
    var ringer = $('#ringPhone')[0];
    ringer.loop = true;
    ringer.play();
  }

  this.stopRingingSound = function(){
    var ringer = $('#ringPhone')[0];
    ringer.pause();
    ringer.currentTime = 0;
  }

    this.isStateDefinedThenGet = function(attribute){
      if(typeof this.state === 'object' && typeof attribute == 'string'){
          return this.state()[attribute];
      }
      else{
        return false;
      }
    }



    this.getDialogVisibility = function(){
      return this.state().isDialogVisible;
    }

    this.getDialogSpinnerVisibility = function(){
      return this.state().isDialogSpinnerVisible;
    }

    this.getConnectionProgressText = function(){
      return this.isStateDefinedThenGet('connectionStatus');
    }

    this.getAnswerButtonVisibility = function(){
      return this.state().isDialogAnswerButtonsVisible;
    }

    this.getCallerPhotoURL = function(){
      if(this.lastCallerInfo){
        return this.lastCallerInfo.large_photo_url;
      }
    }

    this.getCallerName = function(){
      if(this.lastCallerInfo){
        return this.lastCallerInfo.first + ' ' + this.lastCallerInfo.last;
      }
    }

    this.inCall = ko.computed(function(){
        return this.isStateDefinedThenGet('isInCall');
    },this);

    this.isSpinnerVisible = ko.computed(function(){
        return this.isStateDefinedThenGet('isSpinnerVisible');
    },this);


    this.callPanelUpdate = ko.computed(function(){
      if(typeof this.state == 'object'){
        return this.getCallPanelState();
      }
    },this);

    this.getCallPanelState = function(){
      if(typeof this.state == 'object'){
        return  {
            buttonPanelVisible:this.state().isCallBtnPanelVisible,
            callEnabled: this.state().callEnabled,
            callButtonText:this.state().callButtonText,
            callButtonToolTip: this.state().callButtonToolTip,
            hangupButtonEnabled:this.state().hangupEnabled,
            hangupButtonToolTip:this.state().hangupToolTip,
          }
      }
    }


    this.callPanelUpdate.subscribe(function(update){
    s._dispatcher.dispatch('callPanelUpdate',update);
  },this);


  this.onCallPanelQuery = function(){
    if(typeof this.state == 'object'){
      this._dispatcher.dispatch('callPanelUpdate', this.getCallPanelState());
    }
  }
  this.onCallPanelQuery = this.onCallPanelQuery.bind(this);
  this._dispatcher.reg('callPanelQuery',this.onCallPanelQuery);

  this.errorMessage = ko.computed(function(){
    return this.isStateDefinedThenGet('errorMessage');
  },this);




} // end viewModel.


return {
  viewModel: VoiceViewModel,
  template : template
};

}); // end define.
;

define('text!video-chat/call-dialog/template.html',[],function () { return '\n<!-- call dialog -->\n  <div id="call-dialog-holder"\n      data-bind="visible:isDialogVisible()">\n        <div id="call-dialog">\n\n\n          <img id="callerPhoto"\n               data-bind="attr: { src: callerPhotoURL() }">\n          </img>\n\n\n          <div id="name" class="dialog-row">\n            <span class="text"\n                  data-bind="text:callerName()"></span>\n          </div>\n\n\n          <div class="answering-state"\n               data-bind="visible:isSpinnerVisible()">\n\n               <div class=dialog-row>\n                 <span id="answering-call-message"\n                       class="text">Connecting...\n                 </span>\n               </div>\n\n               <div class=dialog-row>\n                 <div  class="screen-center-outer">\n                  <div class="screen-center-inner">\n                     <div id="chore-loader" class="loader"></div>\n                  </div>\n                </div>\n               </div>\n\n               <div class="dialog-row">\n                 <button\n                         class="call-btn hangup-btn"\n                         data-toggle="tooltip"\n                         title="Hangup"\n                         data-bind="click:hangupButtonPressed">\n                   <img id="answering-hangup-img"\n                        class="phone-img do-not-answer-img"\n                        src="./assets/hangup-img.png">\n                   </img>\n                   <span class="hover-circle"><span>\n                 </button>\n               </div>\n\n\n          </div>\n          <!-- End is aswering state. -->\n\n\n          <!--  FriendIsCallingState-->\n\n          <div data-bind="visible:isSpinnerVisible() == false">\n\n            <div id="message"\n                 class=dialog-row>\n                 <span class="text">\n                       is calling you!\n                 </span>\n            </div>\n\n            <div id="control-holder"\n                 class="dialog-row">\n\n                 <div id="buttons-holder">\n\n\n                    <div id="answer" class="button-holder">\n                      <button id="answer-btn"\n                              class="call-btn"\n                              data-toggle="tooltip"\n                              title="Answer"\n                              data-bind="click:answerButtonPressed">\n                        <img id="answer-img"\n                             class="phone-img"\n                              src="./assets/pickup-img.png">\n                        </img>\n                      </button>\n                      <span class="hover-circle"><span>\n                      <div id="answer-text"></div>\n                    </div>\n\n                    <div id="hangup"\n                        class="button-holder">\n\n                      <button\n                              class="call-btn hangup-btn"\n                              data-toggle="tooltip"\n                              title="Do not answer"\n                              data-bind="click:hangupButtonPressed">\n                        <img\n                             class="phone-img hangup-img"\n                             src="./assets/hangup-img.png">\n                        </img>\n                        <span class="hover-circle"><span>\n                      </button>\n                      <div id="hangup-text"></div>\n                    </div>\n\n              </div>\n              <!--  end buttons holder. -->\n            </div>\n            <!--  end controls holder. -->\n\n          </div>\n          <!--  End FriendIsCallingState---->\n\n\n\n        </div>\n\n                <div  id="connection-progress"\n                      data-bind="html:connectionProgressText">\n                </div>\n        </div>\n        <!-- end call dialog holder. -->\n';});


define('right-panel/video-chat/call-dialog/Component',[
  'ko',
  'postbox',
  'text!video-chat/call-dialog/template.html',
  'dispatcher/Dispatcher'
],function(
  ko,
  postbox,
  template,
  Dispatcher
){

function ViewModel(params, componentInfo){
      this.store = params.store;
      this.isDialogVisible = ko.observable(false);
      this.isSpinnerVisible = ko.observable(false);
      this.isAnswerButtonVisible = ko.observable(false);
      this.connectionProgressText = ko.observable('');
      this.callerPhotoURL = ko.observable('');
      this.callerName = ko.observable('');
      this._dispatcher = new Dispatcher();

      this.onStoreMutated = function(){
        this.isDialogVisible(this.store.getDialogVisibility());
        this.isSpinnerVisible(this.store.getDialogSpinnerVisibility());
        this.isAnswerButtonVisible(this.store.getAnswerButtonVisibility());
        this.connectionProgressText(this.store.getConnectionProgressText());
        this.callerPhotoURL(this.store.getCallerPhotoURL());
        this.callerName(this.store.getCallerName());
      }
      this.onStoreMutated = this.onStoreMutated.bind(this);
      this.store.state.subscribe(this.onStoreMutated,this);

      this.answerButtonPressed = function(){
        this._dispatcher.dispatch('answerButtonPressed',true);
      }

      this.hangupButtonPressed = function(){
        this._dispatcher.dispatch('hangupButtonPressed', true);
      }
} // end viewmodel def.


return {
  viewModel: ViewModel,
  template : template
};

}); // end define.
;

define('text!blackboard/template.html',[],function () { return '<link rel="stylesheet" href="./styles/components/blackboard/style.css?v=1.0"></link>\n<div id="blackboard-holder"\n     draggable="false">\n\n  <div id="blackboard-background"\n       data-bind="visible:blackboardOpen(), click:toggleVisibility">\n  </div>\n\n\n  <div id="hideable-area"\n       data-bind="visible:blackboardOpen()">\n\n     <div id="board-trashed-message"\n           data-bind="visible:isTrashedMessageVisible()">\n       Your classmate deleted the board.\n     </div>\n\n\n     <div id="left-tool-bar" class="tool-bar">\n       <button\n               class="top-board-buttons tool-button glyphicon glyphicon glyphicon-trash"\n               data-bind="click:trashCurrentBoard"\n               data-toggle="tooltip"\n               title="Delete board.">\n       </button>\n       <button id="board-undo-button"\n               class="fa fa-undo tool-button top-board-buttons"\n               data-toggle="tooltip"\n               title="Undo delete."\n               data-bind="visible:recentlyTrashedBoards().length > 0, click:undoTrashBoard">\n       </button>\n     </div>\n\n\n    <div id="center-tool-bar"\n         class="tool-bar">\n    <button\n            data-bind="click: setPencilTool"\n            class="tool-button glyphicon glyphicon-pencil"\n            data-toggle="tooltip"\n            data-placement="top"\n            title="Pencil" >\n    </button>\n    <button class="tool-button glyphicon glyphicon-erase"\n            data-bind="click:setEraserTool"\n            data-toggle="tooltip"\n            data-placement="top"\n            title="Eraser">\n    </button>\n    </div>\n\n\n\n    <!-- spinner -->\n    <div  class="screen-center-outer">\n     <div class="screen-center-inner">\n        <div id="blackboard-loader"\n             class="loader"\n             data-bind="visible:spinnerVisible()"></div>\n     </div>\n   </div>\n\n    <span class="blackboard-btn blackboard-prev-btn glyphicon glyphicon-menu-left"\n          data-toggle="tooltip"\n          title="Previous board"\n          data-bind="visible:prevArrowVisible(), click:prevArrowClicked">\n    </span>\n      <canvas id="tool-area"\n               width="1864"\n               height="980">\n      </canvas>\n      <canvas id=\'drawing-area\'\n              width=1864\n              height=980>\n      </canvas>\n      <span class="blackboard-btn blackboard-next-btn glyphicon glyphicon-menu-right"\n            data-toggle="tooltip"\n            title="Next board"\n            data-bind="click:nextArrowClicked">\n      </span>\n  </div>\n<!-- END hideable area -->\n\n\n    <!-- toggle open / close blackboard  -->\n    <div id="blackboard-toggle-button-holder" data-bind="visible:isToggleVisible()">\n      <button id="blackboard-toggle-button"\n              data-toggle="tooltip"\n              title="Chalkboard"\n              data-bind="click:toggleVisibility, visible:!blackboardOpen()"\n              class="blackboardButton glyphicon">\n      </button>\n      <span data-bind="visible:blackboardOpen()"\n            class="blackboard-toggle-button-arrow glyphicon glyphicon-menu-up"></span>\n      <span data-bind="visible:!blackboardOpen()"\n            class="blackboard-toggle-button-arrow glyphicon glyphicon-menu-down"></span>\n    </div>\n\n</div>\n';});

define('blackboard/BlackboardRemoteService',['jquery',
        'socketio',
        'ActiveRemoteService'],
function($,
         io,
         ActiveRemoteService){

    var BlackboardRemoteService = function(){

      Object.setPrototypeOf(this, new ActiveRemoteService());
      this._io = io;
      this._socket = null;
      this._callbacks = {};
      this.lastBoardDataRequest = null;

      this.setMicroServer("blackboard");


      this.initialize = function(){
        var accessToken = this.getAccessToken();
        this._socket = this._io(this.getServerURL(),{
          autoConnect:false,
          reconnection:false,
          query: {token: accessToken}
        });
        this._connect();
      }


      this._connect = function(){
          this._socket.connect();
      }

      this.attachFriendJoinedBlackboardHandler = function(callback){
        this._socket.on('friendJoinedBlackboard',callback);
      }
      this.attachFriendJoinedBlackboardHandler = this.attachFriendJoinedBlackboardHandler.bind(this);

      this.getBoardData = function(boardId){
        if(!boardId || isNaN(boardId)){
          throw new Error("boardId must be a positive integer.");
        }
          var url = this.getServerURL() + '/boards/' + boardId;
          if(this.lastBoardDataRequest){
              this.lastBoardDataRequest.abort();
          }
          var ajaxRequest = this.doBoardDataAjaxRequest(url);
          this.lastBoardDataRequest = ajaxRequest;
      }
      this.getBoardData = this.getBoardData.bind(this);

      this.doBoardDataAjaxRequest = function(url){
        return $.ajax({
          url:url,
          type:'GET',
          beforeSend:this.setAuthorizationHeader,
          success:this._callbacks['onBoardDataReceived'],
          error:function(a,b,err){
            console.log(err);
          }
        });
      }
      this.doBoardDataAjaxRequest = this.doBoardDataAjaxRequest.bind(this);



      this.saveCurrentBoard = function(currentBoard){
        var ack =  this._callbacks['onSaveCallback'];
        if(typeof ack != 'function') throw new Error('saveCurrentBoard callback missing.');
        var json = JSON.stringify(currentBoard);
        this._socket.emit('saveBoardState', {json:json}, ack);
      }
      this.saveCurrentBoard = this.saveCurrentBoard.bind(this);


      this.registerOnSaveCallback = function(callback){
        if(typeof callback != 'function'){
          throw new Error("Save board callback needs to be a function.");
        }
        this._callbacks['onSaveCallback'] = callback;
      }
      this.registerOnSaveCallback = this.registerOnSaveCallback.bind(this);



      /**
       * Requests the last board the current user viewed from the set of
       * boards that are shared with friendId.
       * @param  {Number} friendId The id number of the currently selected friend.
       */
      this.getSharedBoards = function(friendId){
        if(isNaN(friendId) || friendId < 1){
          throw new Error('friendId must be a positive integer.');
        }
        var onSuccess = this._callbacks['onSharedBoardsReceived'];
        if(typeof onSuccess != 'function'){
          throw new Error('onSharedBoardsReceived callback has not been registered.');
        }

        var url = this.getServerURL() + '/friends/' + friendId + '/sharedboards/'
        $.ajax({
          url:url,
          type:'GET',
          beforeSend:this.setAuthorizationHeader,
          success:function(data){
            var parsedData = JSON.parse(data);
            onSuccess(parsedData);
          },
          error:function(a,b,err){
            console.log(err);
          }
        })
      }


      this.getNextBoard = function(boardId,friendId){
        var url = this.getServerURL() + '/friends/' + friendId + '/sharedboards/' + boardId + '/nextboard';
        $.ajax({
          url:url,
          type:'GET',
          beforeSend:this.setAuthorizationHeader,
          success:this._callbacks['onNextBoardRecieved'],
          error:function(a,b,err){
            console.log(err)
          }
        })
      }

      /**
      * @param  {Function} callback The function to be executed on successful retrieval
      *                     of the board. It is passed the board data.
      */
      this.registerOnNextBoardRecievedCallback = function(callback){
        this._callbacks['onNextBoardRecieved'] = callback;
      }


      this.getPreviousBoard = function(boardId,friendId){
        var url = this.getServerURL() + '/friends/' + friendId + '/sharedboards/' + boardId + '/previousboard';
        $.ajax({
          url:url,
          type:'GET',
          beforeSend:this.setAuthorizationHeader,
          success:this._callbacks['onPreviousBoardRecieved'],
          error:function(a,b,err){
            console.log(err)
          }
        })
      }

      this.joinFriend = function(friendId, currentTool){
        if(this._socket){
          var data = {
                      friendId:friendId,
                      currentTool:currentTool
                     };
          this._socket.emit('joinRoom',data,function(result){
            if(result == 'success'){
              // console.log('Blackboard:Connected to friend:' + friendId);
            }
          });
        }
      }

      this.registerOnPreviousBoardRecievedCallback = function(cb){
        this._callbacks['onPreviousBoardRecieved'] = cb;
      }


      this.registerOnBoardDataCallback = function(callback){
        this._callbacks.onBoardDataReceived = callback;
      }

      /**
      * @param  {Function} callback The function to be executed on successful retrieval
      *                             of the board. It is passed the board data.
      */
      this.registerGetSharedBoardsCallback = function(callback){
        this._callbacks['onSharedBoardsReceived'] = callback;
      }


      this.emitMyCursorPosition = function(update,onSuccess){
        this._socket.emit('myCursorPosition',update,function(result){
          if(result == 'success'){

            onSuccess();
          }
        });
      }

      this.attachOnFriendCursorPositionReceivedHandler = function(callback){
        this._socket.on('friendsCursorPosition',callback);
      }
      this.attachOnFriendCursorPositionReceivedHandler = this.attachOnFriendCursorPositionReceivedHandler.bind(this);



      this.emitMyPencilPosition = function(update){
        this._socket.emit('myPencilPosition',update);
      }
      this.emitMyPencilPosition = this.emitMyPencilPosition.bind(this);

      this.attachOnFriendPencilPositionCallback = function(callback){
        this._socket.on('friendPencilPositionUpdate',callback);
      }




      this.emitMyPencilLine = function(pencilLine,onSuccess){
        this._socket.emit('myPencilLine',pencilLine,onSuccess);
      }
      this.emitMyPencilLine = this.emitMyPencilLine.bind(this);


      this.attachFriendsPencilLineUpdateHandler = function(callback){
        this._socket.on('friendsPencilLineUpdate',callback);
      }
      this.attachFriendsPencilLineUpdateHandler = this.attachFriendsPencilLineUpdateHandler.bind(this);




      this.emitMyEraserPosition = function(update){
        this._socket.emit('myEraserPosition', update);
      }
      this.emitMyEraserPosition = this.emitMyEraserPosition.bind(this);


      this.attachOnFriendsEraserPositionUpdateCallback = function(cb){
        this._socket.on('onFriendsEraserPositionUpdate',cb);
      }
      this.attachOnFriendsEraserPositionUpdateCallback = this.attachOnFriendsEraserPositionUpdateCallback.bind(this);


      this.emitMyEraserDown = function(update, acknowledgment){
        this._socket.emit('myEraserDown',update,acknowledgment);
      }
      this.emitMyEraserDown = this.emitMyEraserDown.bind(this);


      this.attachFriendsEraserDownCallback = function(callback){
        this._socket.on('friendsEraserDownUpdate',callback);
      }
      this.attachFriendsEraserDownCallback = this.attachFriendsEraserDownCallback.bind(this);


      this.deleteBoard = function(boardId){
        var url = this.getServerURL() + '/boards/' + boardId
        $.ajax({
          url:url,
          type:"DELETE",
          beforeSend:this.setAuthorizationHeader,
          success:this.onBoardDeleted,
          error:function(a,b,err){
            console.log(err);
          }
        })
      }


      this.registerOnBoardTrashedCallback = function(callback){
        this.checkType(callback);
        this.onBoardTrashed = callback;
      }
      this.registerOnBoardTrashedCallback = this.registerOnBoardTrashedCallback.bind(this);


      this.registerOnFriendTrashedBoard = function(callback){
        this.checkType(callback);
        this._socket.on('boardTrashed',callback);
      }


      this.trashBoard = function(boardId, friendId){
        if(isNaN(boardId) || isNaN(friendId)){
          throw new Error('boardId and friendId must be specified.');
        }
        var url = this.getServerURL() + '/boards/' + boardId;
        $.ajax({
          url:url,
          type:"DELETE",
          beforeSend:this.setAuthorizationHeader,
          success:this.onBoardTrashed,
          error:function(a,b,err){
            console.log(err);
          }
        })

        this._socket.emit('relayTrashBoard',{friendId:friendId, boardId:boardId});
      }
      this.trashBoard = this.trashBoard.bind(this);


      this.registerOnTrashBoardUndone = function(callback){
        this.checkType(callback);
        this.onTrashBoardUndone = callback;
      }

      this.undoTrashBoard = function(boardId, friendId){
         var url = this.getServerURL() + '/boards/' + boardId +'/restore';
         $.ajax({
           url:url,
           type:'post',
           beforeSend:this.setAuthorizationHeader,
           success:this.onTrashBoardUndone,
           error:function(a,b,err){
             console.log(err);
           }
         });
         this._socket.emit('relayRestoreBoard',{friendId:friendId, boardId:boardId});
      }

      this.registerOnFriendRestoredBoard = function(callback){
        this._socket.on('boardRestored',callback);
      }


      this.checkType = function(fn){
        if(typeof fn != 'function'){
          throw new Error("Callback must be a function");
        }
      }

    }

    return BlackboardRemoteService;
});

define('blackboard/canvas/Layer',[],function(){

    var Context = function(viewModel){


      this.setupCanvas = function(){
        var id = this.getLayerId();
        this._canvas = document.getElementById(id);
        if(!this._canvas){
          throw new Error('html template is missing canvas with id ' + id);
        }
        var $canvas = $(this._canvas);
        var tagName = $canvas.prop('tagName');
        if(tagName != 'CANVAS'){
          throw new Error("tag must be a canvas element");
        }
        this._context = this._canvas.getContext('2d');
      }





      this.getContext = function(){
        return this._context;
      }

      this.getCanvas = function(){
        return this._canvas;
      }

      this.clear = function(){
        if(!this._canvas)
          throw new Error('Canvas not set.');
        var w = this._canvas.width;
        var h = this._canvas.height;
        this._context.clearRect(0, 0, w, h);
      }

      this.getLayerId = function(){
        throw new Error('cannot call abstract function.');
      }




      this.normalizedToCanvasCoordinates = function(point){
        if(point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1){
          throw new Error('point must be a normalized point.');
        }
        var width = this.getCanvas().width;
        var height = this.getCanvas().height;
        return {
          x:point.x * width,
          y:point.y * height
        }
      }

      this.getCurrentPosition = function(e){
        var leftOffset = $(this._canvas).offset().left;
        var topOffset = $(this._canvas).offset().top;
        var width = $(this._canvas).width();
        var height = $(this._canvas).height();
        return {
                    x: (e.clientX - leftOffset) / width,
                    y: (e.clientY - topOffset) / height
                }
      }


      this.getHeight = function(){
        return this._canvas.height;
      }

      this.setHeight = function(height){
        if(!height){
          // console.warn('height must be a positive number.')
          return;
        }
        this._canvas.style.height = height + 'px';
      }

      this.getWidth = function(){
        return this._canvas.width;
      }

      this.setWidth = function(width){
        this._canvas.style.width = width + 'px';
      }

    }
    return Context;
});

define('blackboard/canvas/ToolLayer',['blackboard/canvas/Layer'],
function(Layer){

    var ToolLayer = function(viewModel){

      Object.setPrototypeOf(this, new Layer());
      this._layerId = 'tool-area';

      this.getLayerId = function(){
        return this._layerId;
      }
      this.setupCanvas.call(this);
      this.getCurrentPosition = this.getCurrentPosition.bind(this);
      this._context.font = "39px Arial";
      this._context.fillStyle = "#828282";
      this._context.zIndex = "5";


      this.drawEraserCircle = function(radius, point){
        var cPoint = this.normalizedToCanvasCoordinates(point);
        var screenRadius = radius * this.getCanvas().width;
        var initialAngle = 0;
        var terminalAngle = 2 * Math.PI;
        this.clear();
        this._context.lineWidth   = "4";
        this._context.strokeStyle = "#dfffff";
        this._context.beginPath();
        this._context.arc(cPoint.x, cPoint.y, screenRadius, initialAngle, terminalAngle);
        this._context.stroke();
      }

      this.drawFriendsCursor = function(point){
        var url = './assets/cursor_friend_small.png';
        this.drawImage(point, 0, url);
      }

      this.drawFriendLeftMarker = function(y){
        var canvasHeight = this._canvas.height;
        var y = y * canvasHeight;
        var left = 20; // pixels.
        this.clear();
        this._context.fillText("<- Friend",  left, y);
      }

      this.drawFriendRightMarker = function(y){
        var canvasHeight = this._canvas.height;
        var y = y * canvasHeight;
        var right = 180;
        this.clear();
        this._context.fillText("Friend ->", this._canvas.width - right, y);
      }

      this.drawFriendsPencil = function(point){
          var url = './assets/friends_pencil.png';
          var verticalOffset = -67;
          this.drawImage(point, verticalOffset, url);
      }
      this.drawFriendsPencil = this.drawFriendsPencil.bind(this);


      this.drawFriendsEraser = function(point){
        var url = './assets/eraser_friend.png';
        var verticalOffset = -45;
        this.drawImage(point, verticalOffset, url);
        // this.drawEraserCircle(radius, point);
      }

      this.drawImage = function(point, yOffset, imgURL){
        var image = new Image();
        image.src = imgURL;
        var canvasPoint = this.normalizedToCanvasCoordinates(point);
        var x = canvasPoint.x;
        var y = canvasPoint.y;
        this.clear();
        this.getContext().drawImage(image,x,y + yOffset);
      }






    }
    return ToolLayer;
});

define('blackboard/canvas/DrawingLayer',['blackboard/canvas/Layer'],
function(Layer){

    var DrawingLayer = function(viewModel){

      Object.setPrototypeOf(this, new Layer());
      this._layerId = 'drawing-area';

      this.getLayerId = function(){
        return this._layerId;
      }
      // ensures that 'this' in setupCanvas refers to this DrawingLayer.
      // and that _context and _cavas are visible in this Layer.
      this.setupCanvas.call(this);
      this.getCurrentPosition = this.getCurrentPosition.bind(this);
      this.getCanvas().oncontextmenu = function(){
        return false;
      }



      this.drawBoard = function(commands){
        this.clear();
        this._context.lineWidth   = "4";
        this._context.strokeStyle = "#ffffff";
        var data = commands;
        for(var i = 0; i < data.length; i++){

          // only two kinds of commands at this point.
          if(data[i].length == 1){
            var radius = data[i][0].radius;
            var point = {
                          x:data[i][0].x,
                          y:data[i][0].y
                        };
            this.eraseArea(radius,point);
          }
          else if(data[i].length == 2){
            this.drawLine(data[i]);
          }
        } // end loop.
      }

      this.eraseArea = function(radius, point){
        this._context.beginPath();
        var startAngle = 0;
        var endAngle = 2 * Math.PI;
        var p = this.normalizedToCanvasCoordinates(point);
        var screenRadius = radius * this.getWidth();
        this._context.arc(p.x, p.y, screenRadius, startAngle, endAngle);
        this._context.fillStyle = 'black';
        this._context.fill();
      }

      this.drawLine = function(line){
        var width = this.getWidth();
        var height = this.getHeight();

        this._context.beginPath();
        for(var j = 0; j < line.length - 1; j++){

          var startX = line[j].x * width;
          var startY = line[j].y * height;
          this._context.moveTo(startX, startY);


          var endX = line[j + 1].x * width;
          var endY = line[j + 1].y * height;
          this._context.lineTo(endX,endY);
        }
        this._context.stroke();
      }



    }
    return DrawingLayer;
});

define('blackboard/canvas/Canvas',['blackboard/canvas/ToolLayer',
        'blackboard/canvas/DrawingLayer'],
  function(ToolLayer,
           DrawingLayer){

    var Canvas = function(viewModel){

      if(!viewModel || typeof viewModel.setMyCursorPosition != 'function'){
        throw new Error('Canvas must have a board collection injected.');
      }
      this.viewModel = viewModel;
      this.toolLayer = new ToolLayer();
      this.drawingLayer = new DrawingLayer();
      this._drawingCanvas = this.drawingLayer.getCanvas();

      this.HIDEABLE_AREA_ID = 'hideable-area'
      this.mouseDown = false;
      this.LEFT_MOUSE_BUTTON = 0;
      this.RIGHT_MOUSE_BUTTON = 2;


      this.initialize = function(){
        this._hideableArea = document.getElementById(this.HIDEABLE_AREA_ID);
        $(window).on('resize',this.resizeBlackboard);
        this.initMouseListeners();
      }

      this.clear = function(){
        this.toolLayer.clear();
      }
      this.clear = this.clear.bind(this);

      this.mouseMoveHandler = function(e){
        var currentPosition = this.drawingLayer.getCurrentPosition(e);

        var tool = this.viewModel.getMyCurrentTool();
        this.toolLayer.clear();

        if(tool == 'cursor'){
          this.viewModel.setMyCursorPosition(currentPosition);
        }
        else if(tool == 'eraser'){
          var radius = this.viewModel.ERASER_RADIUS;
          this.drawEraserCircle(radius, currentPosition);
          if(this.mouseDown == false){
             this.viewModel.setMyEraserPosition(currentPosition);
          }else{
            this.viewModel.setMyEraserDown(currentPosition);
            this.viewModel.startSaveCountDown();
          }
        }
        else if(tool == 'pencil'){

          if(this.mouseDown == false){
            this.viewModel.setMyPencilPosition(currentPosition);
          }
          else{
            this.possiblyDrawLine(currentPosition);
          }
        }
      }
      this.mouseMoveHandler = this.mouseMoveHandler.bind(this);


      /**
       * Only does a draw line request if the first point
       * of the line has been set.
       * @param  {[type]} currentMousePosition
       */
      this.possiblyDrawLine = function(currentMousePosition){
        if(!currentMousePosition){
          throw new Error('currentMousePosition must be an object with a x and y coordinate.');
        }
        if(!this.previousPosition){
          this.previousPosition = currentMousePosition;
        }
        else{

          this.viewModel.startSaveCountDown();
          this.viewModel.setMyPencilLine({
            p0:this.previousPosition,
            p1:currentMousePosition,
          });
          this.previousPosition = currentMousePosition;
        }
      }
      this.possiblyDrawLine = this.possiblyDrawLine.bind(this);




      this.mouseDownHandler = function(event){
        this.mouseDown = true;
        if(event.button == this.RIGHT_MOUSE_BUTTON){
          this.viewModel.setEraserTool();
        }
      }
      this.mouseDownHandler = this.mouseDownHandler.bind(this);


      this.mouseUpHandler = function(event){
        this.mouseDown = false;
        this.previousPosition = null;
        if(event.button == this.RIGHT_MOUSE_BUTTON){
          this.viewModel.setPencilTool();
        }
      }
      this.mouseUpHandler = this.mouseUpHandler.bind(this);

      /**
       * ensures that the tool does not "stick" down
       * when the users cursor leaves the black board.
       *
       * @param  {object} event
       */
      this.mouseLeaveHandler = function(event){

        if(this.mouseDown){
          var currentPosition = this.drawingLayer.getCurrentPosition(event);
          var tool = this.viewModel.getMyCurrentTool();

          if(tool == 'pencil'){
            this.mouseDown = false;
            this.possiblyDrawLine(currentPosition);
          }
          else if(tool == 'eraser'){
            this.mouseDown = false;
          }
          this.previousPosition = null;
        }
      }
      this.mouseLeaveHandler = this.mouseLeaveHandler.bind(this);

      /**
       * Absolutely needed to prevent accidentally draging items on the screen
       * when the user drags the the tool off from the board.
       * @param  {object} e event
       */
      this.dragStartHandler = function(e){
        e.preventDefault();
      }
      this.dragStartHandler = this.dragStartHandler.bind(this);


      this.initMouseListeners = function(){
        this._drawingCanvas.onmousemove = this.mouseMoveHandler;
        this._drawingCanvas.onmousedown = this.mouseDownHandler;
        this._drawingCanvas.onmouseup = this.mouseUpHandler;
        this._drawingCanvas.onmouseleave = this.mouseLeaveHandler;
        this._drawingCanvas.ondragstart = this.dragStartHandler;

      }
      this.initMouseListeners = this.initMouseListeners.bind(this);


      this.setMyToolToPencil = function(){
        this._drawingCanvas.style.cursor = "url('./assets/my_pencil.cur') 0 45,auto";
      }

      this.setMyToolToEraser = function(){
        this._drawingCanvas.style.cursor = "url('./assets/eraser_my.cur') 0 45,auto";
      }


      this.drawFriendsCursor = function(update){
          this.toolLayer.drawFriendsCursor(update.position);
      }
      this.drawFriendsCursor = this.drawFriendsCursor.bind(this);

      this.drawFriendsEraser = function(point){
        this.toolLayer.drawFriendsEraser(point);
      }
      this.drawFriendsEraser = this.drawFriendsEraser.bind(this);

      this.drawFriendsPencil = function(position){
        this.toolLayer.drawFriendsPencil(position);
      }
      this.drawFriendsPencil = this.drawFriendsPencil.bind(this);

      this.drawMyPencilLine = function(line){
        this.drawLine(line);
      }

      this.drawFriendsPencilLine = function(line){
        this.drawLine(line);
        this.drawFriendsPencil(line[1]);
      }

      this.friendEraseArea = function(radius, point){
        this.drawFriendsEraser(point);
        this.eraseArea(radius, point);
      }
      this.friendEraseArea = this.friendEraseArea.bind(this);


      this.eraseArea = function(radius, point){
        this.drawingLayer.eraseArea(radius, point);
      }
      this.eraseArea = this.eraseArea.bind(this);


      this.drawEraserCircle = function(radius, point){
        this.toolLayer.drawEraserCircle(radius, point);
      }

      this.drawFriendLeftMarker = function(y){
        this.toolLayer.drawFriendLeftMarker(y);
      }

      this.drawFriendRightMarker = function(y){
        this.toolLayer.drawFriendRightMarker(y);
      }

      this.resizeBlackboard = function(){
        var ASPECT_RATIO = 2.5;  // 16:9 ratio.
        var $hideableArea = $(this._hideableArea);
        var newHeight = $hideableArea.width() / ASPECT_RATIO;
        this.drawingLayer.setHeight(newHeight);
        this.toolLayer.setHeight(newHeight);
      }
      this.resizeBlackboard = this.resizeBlackboard.bind(this);

      /**
       * show the given board.
       */
      this.drawBoard = function(commands){
        this.drawingLayer.drawBoard(commands);
      }

      this.drawLine = function(line){
        this.drawingLayer.drawLine(line);
      }
      this.drawLine = this.drawLine.bind(this);


    }
    return Canvas;
});

define('blackboard/boards/BlackBoard',[],
function(){

    var BlackBoard = function(board){
    

      if(!board || typeof board != 'object'){
        throw new Error('Board data must be passed to constructor.');
      }
      if(typeof board.last_loaded != 'string'){
        throw new Error('last_loaded must be a iso date.');
      }
      if(!board.board_id || isNaN(board.board_id)){
        throw new Error("board_id missing or not a number.");
      }
      if(!board.board_url || typeof board.board_url != 'string'){
        throw new Error("board_url missing or not a string.");
      }


      var date = new Date(board.last_loaded);
      this.lastLoaded = date.getTime();
      this.boardId = board.board_id;
      this.boardURL = board.board_url;
      if(Array.isArray(board.commands)){
        this.commands = board.commands;
      }
      else{
        this.commands = [];
      }
      this.dirty = false;

      this.getCommands = function(){
        return this.commands.slice(0);
      }

      this.setCommands = function(commands){
        this.commands = commands;
      }

      this.updateState = function(command){
        this.commands.push(command);
      }

      this.getId = function(){
        return this.boardId;
      }

      this.isDirty = function(){
        return this.dirty;
      }

      this.setDirty = function(){
        this.dirty = true;
      }

      this.getURL = function(){
        return this.boardURL;
      }

      this.getLastTimeLoaded = function(){
        return this.lastLoaded;
      }

      this.getLastTimeLoadedInISO = function(){
        var ms = this.getLastTimeLoaded();
        return new Date(ms).toISOString();
      }

      this.setLastTimeLoaded = function(time){
        this.lastLoaded = time;
      }

      this.deepCopy = function(){
        var rawData = {
          board_url:this.getURL(),
          last_loaded:this.getLastTimeLoadedInISO(),
          is_dirty:this.isDirty(),
          board_id:this.getId(),
          commands:this.getCommands()
        }
        return new BlackBoard(rawData);
      }

    }
    return BlackBoard;
});

define('blackboard/BlackboardCollection',['blackboard/boards/BlackBoard'],
function(BlackBoard){

    var BlackboardCollection = function(){

      this._boards = [];
      this._currentBoardIndex = -1;

      this.getBoards = function(){
        return this._boards.slice(0);
      }

      this.setBoards = function(boards){
        if(!Array.isArray(boards)){
          throw new Error("Needs to be an array.");
        }
        else if(boards.length < 1){
          throw new Error("Needs to have at least one element.");
        }
        this._boards = [];
        for(var i = 0; i < boards.length; i++){
          var rawData = boards[i];
          var blackboard = new BlackBoard(rawData);
          this._boards.push(blackboard);
        }
        var index = this.getLastViewedBoardIndex();
        this._currentBoardIndex = index;
      }
      this.setBoards = this.setBoards.bind(this);


      this.getLastViewedBoardIndex = function(){
        var candidateCurrentBoard = null;
        var latestSoFar = 0;
        var index = 0;
        for(var i = 0; i < this._boards.length; i++){
          if(this._boards[i].lastLoaded > latestSoFar){
            latestSoFar = this._boards[i].lastLoaded;
            index = i;
          }
        }
        return index;
      }


      this.appendBoard = function(rawBoard){
        var blackBoard = new BlackBoard(rawBoard);
        this._boards.push(blackBoard);
        this._currentBoardIndex = this._boards.length - 1;
        }


      this.setCurrentBoardById = function(boardId){
        for(var i = 0; i < this.getCount(); i++){
          var candidateId = this._boards[i].getId();
          if(boardId == candidateId){
            this._currentBoardIndex = i;
            return;
          }
        }
        throw new Error("That boardId does not exist in the board set.");
      }


      this.setCurrentBoardIndex = function(index){
        if(isNaN(index) || index < 0 || index >= this.getCount()){
          throw new Error("Invalid index.");
        }
        this._currentBoardIndex = index;
      }


      this.deleteAll = function(){
        this._currentBoardIndex = null;
        this._boards = [];
      }


      this.getCurrentBoard = function(){
        return this._boards[this._currentBoardIndex].deepCopy();
      }

      // private.
      this._getCurrentBoard = function(){
        var board = this._boards[this._currentBoardIndex];
        if(!board){
          throw new Error("Current board has not been initialized.");
        }
        else{
          return board;
        }
      }

      this.pushEraserCallOntoState = function(update){
        if(this.isEmpty()){
          throw new Error("Can't store erase call because current board does not exist yet.");
        }
        var command = [{
          type:'e',
          x:update.point.x,
          y:update.point.y,
          radius:update.radius
        }]
        var currentBoard = this._getCurrentBoard();
        currentBoard.setDirty();
        currentBoard.updateState(command);
      }

      this.appendLineToCurrentBoard = function(line){
        if(!line.p0 || !line.p1){
          throw new Error('Lines must be defined by two points.');
        }
        var currentBoard = this._getCurrentBoard();
        currentBoard.updateState([line.p0, line.p1]);
        currentBoard.setDirty();
      }


      this.getCurrentBoardCommandCount = function(){
        return this._getCurrentBoard().getCommands().length;
      }

      this.isEmpty = function(){
        return this._boards.length == 0;
      }

      this.getCount = function(){
        return this._boards.length;
      }

      this.getCurrentBoardIndex = function(){
        return this._currentBoardIndex;
      }

      this.getCurrentBoardCommands = function(){
        return this._getCurrentBoard().getCommands();
      }

      this.getCurrentBoardId = function(){
        return this._getCurrentBoard().getId();
      }

      this.isCurrentBoardDirty = function(){
        var board = this._getCurrentBoard();
        if(board){
          return board.isDirty();
        }
        else{
          return false;
        }
      }
      this.isCurrentBoardDirty = this.isCurrentBoardDirty.bind(this);

      this.getCurrentBoardURL = function(){
        return this._getCurrentBoard().getURL();
      }

      this.setCurrentBoardCommands = function(state){
        this._getCurrentBoard().setCommands(state);
      }
    }
    return BlackboardCollection;
});

this.selectedClassmateId
define('blackboard/ViewModel',[
  'ko',
  'postbox',
  'dispatcher/Dispatcher',
  'text!blackboard/template.html',
  'blackboard/BlackboardRemoteService',
  'blackboard/canvas/Canvas',
  'blackboard/BlackboardCollection'
],
function(ko,
         postbox,
         Dispatcher,
         template,
         RemoteService,
         Canvas,
         BlackboardCollection){

  function BlackboardViewModel(params,componentInfo){


    this.dis = new Dispatcher();
    this.selectedClassmateId = -1;
    this.isToggleVisible = ko.observable(false);
    this.spinnerVisible = ko.observable(false);
    this.prevArrowVisible = ko.observable(false);
    this.blackboardOpen = ko.observable(false);
    this.isTrashedMessageVisible = ko.observable(false);
    this.recentlyTrashedBoards = ko.observableArray([]);


    this._remoteService = new RemoteService();
    this.SAVING_DELAY = 5000; // * 60;
    this.ERASER_RADIUS = 0.02;

    this.boards = new BlackboardCollection();




    // tool stuff.
    this._myCurrentTool = 'cursor';
    this._friendsCurrentTool = 'cursor';


    this.getMyCurrentTool = function(){
      return this._myCurrentTool;
    }
    this.getMyCurrentTool = this.getMyCurrentTool.bind(this);


    /**
     * "slides" the blackboard up or down.
     * @return {[type]} [description]
     */
    this.toggleVisibility = function(){
      if(!this.blackboardOpen()){
        this.blackboardOpen(true);
        this._canvas.resizeBlackboard();
        var self = this;
        setTimeout(function(){
          self._canvas.resizeBlackboard();
        },50);
      }
      else{
          this.blackboardOpen(false);
      }
    }
    this.toggleVisibility = this.toggleVisibility.bind(this);




    this.hideBlackboard = function(){
      this.blackboardOpen(false);
      this.isToggleVisible(false);
    }
    this.hideBlackboard = this.hideBlackboard.bind(this);
    this.openGroupId = this.dis.reg('showGroupView', this.hideBlackboard);
    this.groupInfoId  = this.dis.reg('groupInfo', this.hideBlackboard);




    this.handleFriendChange = function(classmate){
      if(classmate){
        this.selectedClassmateId = classmate.getId();
        var id = this.selectedClassmateId;
        this.possiblySaveState();
        if(this._canvas.clear){
          this._canvas.clear();
        }
        this.spinnerVisible(true);
        this._remoteService.getSharedBoards(id);
        this._remoteService.joinFriend(id, this._myCurrentTool);
        this.recentlyTrashedBoards([]);
        this.isToggleVisible(true);
      }
      else{
        this.blackboardOpen(false);
      }
    }
    this.handleFriendChange = this.handleFriendChange.bind(this);
    this.classmateCallbackId = this.dis.reg('focusPerson', this.handleFriendChange);




    /**
     * Asks the remote service to send out the current position of this
     * user on the black board so that the friend can see where the current
     * user is on the board.
     * @param  {object} position
     */
    this.setMyCursorPosition = function(position){
      if(this.boards.isEmpty() == false){
        var update = {
          position:position,
          boardId:this.boards.getCurrentBoardId(),
          friendId:this.selectedClassmateId
        }
        var self = this;
        this._remoteService.emitMyCursorPosition(update,function(){
          // on success.
        });
      }
    }
    this.setMyCursorPosition = this.setMyCursorPosition.bind(this);
    this._canvas = new Canvas(this);


    /**
     * Cavvas is only updated if the friend is the currently
     * selected friend and the current board id matches
     * the board id in the update.
     * @param  {[type]} update [description]
     */
    this.onFriendsCursorPositionReceived = function(update){
      if(this.selectedClassmateId == update.friendId && update.boardId == this.boards.getCurrentBoardId()){
          this._canvas.drawFriendsCursor(update);
      }
      else if(this.selectedClassmateId == update.friendId){
        this.drawFriendPositionHintMarker(update);
      }
    }
    this.onFriendsCursorPositionReceived = this.onFriendsCursorPositionReceived.bind(this);


    /**
     * Gives a hint to the current user about which
     * way they should move through the boards to
     * see what their friend is doing.
     * @param  {[type]} update [description]
     */
    this.drawFriendPositionHintMarker = function(update){
      if(update.boardId < this.boards.getCurrentBoardId()){
        this._canvas.drawFriendLeftMarker(update.position.y);
      }
      else if(update.boardId > this.boards.getCurrentBoardId()){
        this._canvas.drawFriendRightMarker(update.position.y);
      }
    }
    this.drawFriendPositionHintMarker = this.drawFriendPositionHintMarker.bind(this);



    this.setMyPencilPosition = function(position){
      if(this.boards.isEmpty() == false){
        var update = {
          position:position,
          boardId:this.boards.getCurrentBoardId(),
          friendId:this.selectedClassmateId
        }
        this._remoteService.emitMyPencilPosition(update);
      }
    }
    this.setMyPencilPosition = this.setMyPencilPosition.bind(this);


    /**
     * Attemps to ask the canvas to draw the friends pencil
     * However if the friends pencil is on another board
     * it will no be drawn.
     * @param  {object} update
     */
    this.onFriendPencilPositionReceived =  function(update){
        if(update.friendId == this.selectedClassmateId && this.boards.isEmpty() == false){
          if(update.boardId == this.boards.getCurrentBoardId()){
              this._canvas.drawFriendsPencil(update.position);
          }
          else{
            this.drawFriendPositionHintMarker(update);
          }
        }
    }
    this.onFriendPencilPositionReceived = this.onFriendPencilPositionReceived.bind(this);

    this.setMyPencilLine = function(pencilLine){
      pencilLine.friendId = this.selectedClassmateId;
      pencilLine.boardId = this.boards.getCurrentBoardId();
      var self = this;
      this._remoteService.emitMyPencilLine(pencilLine,function(){
        self.onPencilLineSent(pencilLine);
        self.startSaveCountDown();
      });
    }

    /**
     * An acknowledgment function which gets
     * exectuted when a line has been successfully
     * sent out to all subscribers of the current board.
     */
    this.onPencilLineSent = function(line){
      let formattedLine = [line.p0,line.p1];
      this.boards.appendLineToCurrentBoard(line);
      this._canvas.drawMyPencilLine(formattedLine);
    }
    this.onPencilLineSent = this.onPencilLineSent.bind(this);


    /**
     *
     * @param  {object} position of the form {x:Number,y:Number}
     */
    this.setMyEraserPosition = function(position){
      position.boardId = this.boards.getCurrentBoardId();
      position.friendId = this.selectedClassmateId;
      this._remoteService.emitMyEraserPosition(position);
    }
    this.setMyEraserPosition = this.setMyEraserPosition.bind(this);


    /**
     * Updates the board with the friends eraser position.
     * @param  {[type]} update [description]
     */
    this.onFriendsEraserPositionReceived = function(update){
      if(update.friendId == this.selectedClassmateId){
        if(update.boardId == this.boards.getCurrentBoardId()){
          this._canvas.drawFriendsEraser(update.position);
        }
        else{
          this.drawFriendPositionHintMarker(update);
        }
      }
    }
    this.onFriendsEraserPositionReceived = this.onFriendsEraserPositionReceived.bind(this);


    this.setMyEraserDown = function(point){
      var self = this;
      this._remoteService.emitMyEraserDown({
        point:point,
        friendId:this.selectedClassmateId,
        boardURL:this.boards.getCurrentBoardURL(),
        radius:self.ERASER_RADIUS,
      },self.getOnMyEraserDownFn(point));
    }
    this.setMyEraserDown = this.setMyEraserDown.bind(this);



    this.getOnMyEraserDownFn = function(point){
      var self = this;
      return function(){
        let update = {point:point,radius:self.ERASER_RADIUS};
        self.boards.pushEraserCallOntoState(update);
        self._canvas.eraseArea(self.ERASER_RADIUS, point);
        self.startSaveCountDown();
      }
    }
    this.getOnMyEraserDownFn = this.getOnMyEraserDownFn.bind(this);


    /**
     * Handles the erasing event from the current friend.
     */
    this.onFriendsEraserDown = function(update){
      if(update.friendId == this.selectedClassmateId){
        if(update.boardURL == this.boards.getCurrentBoardURL()){
          this.boards.pushEraserCallOntoState(update);
          this._canvas.friendEraseArea(update.radius,update.point);
        }
      }
    }
    this.onFriendsEraserDown = this.onFriendsEraserDown.bind(this);





    /**
     * Draws the friends line to the canvas if the
     * current board id is the same as the arguments
     * boardId.   also updates the current board state by
     * appending the line to it.
     *
     * friendId:Number
     * boardId:Number
     * line: {p0:{x,y},p1:{x,y}}
     */
    this.onFriendPencilLineReceived = function(pencilLine){
      if(this.selectedClassmateId == pencilLine.friendId){
        if(pencilLine.boardId == this.boards.getCurrentBoardId()){
          var line = [];
          var p0 = pencilLine.line.p0;
          var p1 = pencilLine.line.p1;
          line.push({x:p0.x,y:p0.y});
          line.push({x:p1.x,y:p1.y});
          this.boards.appendLineToCurrentBoard({p0:p0,p1:p1});
          this._canvas.drawFriendsPencilLine(line);
        }
        else{
          this.drawFriendPositionHintMarker(pencilLine.line.p1);
        }
      }
    }
    this.onFriendPencilLineReceived = this.onFriendPencilLineReceived.bind(this);


    /**
     * Handles what happens when the board data
     * is loaded from the remote service.
     * @param  {object} board has a id and lines property.
     */
    this.onSharedBoardsReceived = function(boards){

      this.boards.setBoards(boards);
      if(this.boards.getCurrentBoardIndex() > 0){
        this.prevArrowVisible(true);
      }
      else{
        this.prevArrowVisible(false);
      }

      var currentBoardId = this.boards.getCurrentBoardId();
      this._remoteService.getBoardData(currentBoardId);
    }
    this.onSharedBoardsReceived = this.onSharedBoardsReceived.bind(this);




    this.timeoutReferences = [];
    this.testMode = false;
    this.startSlowServerResponseTimer = function(testString){
      var self = this;
        var timerReferece = setTimeout(function(){
                if(!self.testMode)
                  alert("Problem loading chalkboards, try refreshing the screen.");
          },5000);
        this.timeoutReferences.push(timerReferece);
    }
    this.startSlowServerResponseTimer = this.startSlowServerResponseTimer.bind(this);



    /**
     * Does nothing if the id of the board does not match the current
     * board's id.
     * @param  {JSON} boardData
     */
    this.onBoardDataReceived = function(boardData){
      var boardData = JSON.parse(boardData);
      if(boardData.board_id == this.boards.getCurrentBoardId()){
        this._canvas.drawBoard(boardData.lines);
        this.spinnerVisible(false);
        this.boards.setCurrentBoardCommands(boardData.lines);
      }
     }
    this.onBoardDataReceived = this.onBoardDataReceived.bind(this);



    /**
     * Saves the changes to the server when the user
     * stops doing their work for more than a few seconds.
     * or they switch to a new board.
     */
    this.saveTimers = [];
    this.startSaveCountDown = function(callback){
      this.clearExistingTimers();
      this.createNewSaveTimer();
    }
    this.startSaveCountDown = this.startSaveCountDown.bind(this);



    this.clearExistingTimers = function(){
      if(this.saveTimers.length > 0){
        for(var i = 0; i < this.saveTimers.length; i++){
          clearTimeout(this.saveTimers[i]);
        }
        this.saveTimers = [];
      }
    }
    this.clearExistingTimers = this.clearExistingTimers.bind(this);



    /**
     * Schedules a new save event to occur after SAVING_DELAY time.
     * @param  {Function} callback  for testing purposes.
     */
    this.createNewSaveTimer = function(callback){
      var self = this;
      var saveTimerHandle = setTimeout(function(){
        self.possiblySaveState();
        if(callback && typeof callback == 'function'){
              callback(true);
        }
      },self.SAVING_DELAY);
      this.saveTimers.push(saveTimerHandle);
    }
    this.createNewSaveTimer = this.createNewSaveTimer.bind(this);


    this.setPencilTool = function(){
     this._myCurrentTool = 'pencil';
     this._canvas.setMyToolToPencil();
    }
    this.setPencilTool = this.setPencilTool.bind(this);

    this.setEraserTool = function(){
      this._myCurrentTool = 'eraser';
      this._canvas.setMyToolToEraser();
    }


    /**
        Trashes the current board.
    **/
    this.trashCurrentBoard = function(){
      try{
        this.spinnerVisible(true);
        var currentBoardId = this.boards.getCurrentBoardId();
        var friendId = this.selectedClassmateId;
        this.possiblySaveState();
        this._remoteService.trashBoard(currentBoardId, friendId);
      }
      catch(err){
        console.log(err.message);
      }
    }
    this.trashCurrentBoard = this.trashCurrentBoard.bind(this);



    this.onBoardTrashed = function(jsonBoard){
      var trashedBoard = JSON.parse(jsonBoard);
      var trashedBoardId = trashedBoard.boardId;
      var friendId = this.selectedClassmateId;
      this._remoteService.getSharedBoards(friendId);
      this.recentlyTrashedBoards.push(trashedBoardId);
    }
    this.onBoardTrashed = this.onBoardTrashed.bind(this);


    this.undoTrashBoard = function(){
      if(this.recentlyTrashedBoards().length <= 0){
        throw new Error('Cannot undo because there is no recently trashed boards.');
      }
      var lastBoardTrashed = this.recentlyTrashedBoards.pop(); // oldest of the recently trashed.
      var friendId = this.selectedClassmateId;
      this._remoteService.undoTrashBoard(lastBoardTrashed, friendId);
    }

    this.onTrashBoardUndone = function(){
      var friendId = this.selectedClassmateId;
      this._remoteService.getSharedBoards(friendId);
    }
    this.onTrashBoardUndone = this.onTrashBoardUndone.bind(this);

    this.onFriendRestoredBoard = function(info){
      this.validateBoardUpdateInfo(info);
      var friendId = info.friendId;
      let selectedClassmateId = this.selectedClassmateId;
      if(friendId == selectedClassmateId){
        this._remoteService.getSharedBoards(friendId);
      }
    }
    this.onFriendRestoredBoard = this.onFriendRestoredBoard.bind(this);


    this.onFriendTrashedBoard = function(info){
      this.validateBoardUpdateInfo(info);
      var currentFriendId = this.selectedClassmateId;
      var currentBoardId = this.boards.getCurrentBoardId();
      if(info.friendId == currentFriendId && currentBoardId == info.boardId){
        this._remoteService.getSharedBoards(currentFriendId);
        this.isTrashedMessageVisible(true);
        var self = this;
        setTimeout(function(){
          self.isTrashedMessageVisible(false);
        },3000);
      }
    }
    this.onFriendTrashedBoard = this.onFriendTrashedBoard.bind(this);

    this.validateBoardUpdateInfo = function(info){
      if(!info || typeof info != 'object' || isNaN(info.friendId) || info.friendId < 1){
        throw new Error("Invalid trash board command,  friendId is required.");
      }
      if(!info.boardId || isNaN(info.boardId) || info.boardId < 1){
        throw new Error('boardId must be a positive integer.');
      }
    }


    /**
     * [description]
     * @param  {object} data has friendId and currentTool
     */
    this.onFriendToolUpdated = function(data){
      if(data.friendId == this.selectedClassmateId){
        this._friendsCurrentTool = data.currentTool;
      }
    }
    this.onFriendToolUpdated = this.onFriendToolUpdated.bind(this);


    this.onAuth = function(update){
      if(update.state == 'authenticated'){
        this._remoteService.initialize();
        this._canvas.initialize();

        this._remoteService.registerGetSharedBoardsCallback(this.onSharedBoardsReceived);
        this._remoteService.registerOnBoardDataCallback(this.onBoardDataReceived);
        this._remoteService.registerOnNextBoardRecievedCallback(this.onNextBoardRecieved);
        this._remoteService.registerOnPreviousBoardRecievedCallback(this.onPreviousBoardRecieved);
        this._remoteService.registerOnSaveCallback(this.onCurrentBoardSaved);
        this._remoteService.registerOnBoardTrashedCallback(this.onBoardTrashed);
        this._remoteService.registerOnFriendTrashedBoard(this.onFriendTrashedBoard);
        this._remoteService.registerOnTrashBoardUndone(this.onTrashBoardUndone);
        this._remoteService.registerOnFriendRestoredBoard(this.onFriendRestoredBoard);

        this._remoteService.attachFriendJoinedBlackboardHandler(this.onFriendToolUpdated);
        this._remoteService.attachOnFriendCursorPositionReceivedHandler(this.onFriendsCursorPositionReceived);
        this._remoteService.attachOnFriendPencilPositionCallback(this.onFriendPencilPositionReceived);
        this._remoteService.attachFriendsPencilLineUpdateHandler(this.onFriendPencilLineReceived);
        this._remoteService.attachOnFriendsEraserPositionUpdateCallback(this.onFriendsEraserPositionReceived);
        this._remoteService.attachFriendsEraserDownCallback(this.onFriendsEraserDown);
        this.setPencilTool() // so the user can draw right away.
      }
    }
    this.onAuth = this.onAuth.bind(this);
    this.dis.reg('authState',this.onAuth);




    this.onCurrentBoardSaved = function(){
      console.log('Current board saved.');
    }
    this.onCurrentBoardSaved = this.onCurrentBoardSaved.bind(this);


    this.prevArrowClicked = function(){
      this.possiblySaveState();
      this.spinnerVisible(true);
      var boardId = this.boards.getCurrentBoardId();
      var friendId = this.selectedClassmateId;
      this._remoteService.getPreviousBoard(boardId,friendId);
    }


    this.nextArrowClicked = function(){
      this.possiblySaveState();
      this.spinnerVisible(true);
      var currentBoardId = this.boards.getCurrentBoardId();
      var currentFriendId = this.selectedClassmateId;
      this._remoteService.getNextBoard(currentBoardId, currentFriendId);
    }


    this.possiblySaveState = function(){
      if(this.boards.isEmpty() == false && this.boards.isCurrentBoardDirty()){
        var currentBoard = this.boards.getCurrentBoard();
        this._remoteService.saveCurrentBoard(currentBoard);
      }
    }
    this.possiblySaveState = this.possiblySaveState.bind(this);


    /**
     * @param  {object} jsonBoard
     */
    this.onNextBoardRecieved = function(jsonBoard){
      var board = JSON.parse(jsonBoard);
      this.boards.appendBoard(board);
      var currentBoardId = this.boards.getCurrentBoardId();
      this._remoteService.getBoardData(currentBoardId);
      this.prevArrowVisible(true);
    }
    this.onNextBoardRecieved = this.onNextBoardRecieved.bind(this);


    /**
     * Takes an json array of two boards, where is 2nd is
     * the board that is being switched too and the 1st is
     * the one that comes before it.  IF the 1st one has
     * board_id == -1 then that signifies that there is no
     * previous board and that the left arrow button should
     * be hidden to contrain the user from attempting to
     * go to a left board when one does not exist.
     * @param  {json} boards is a json array of boards.
     */
    this.onPreviousBoardRecieved = function(jsonBoards){
      var boards = JSON.parse(jsonBoards);
      if(boards.length != 2 || isNaN(boards[1].board_id)){
        throw new Error('onPreviousBoardRecieved() expects JSON array of length 2 as input.');
      }
      if(this.boards.isEmpty()){
        throw new Error("Can't set previous board without its reference existing somewhere in the board set.");
      }
      if(boards[0].board_id == -1 && boards[1].board_id != -1){ // there is no board before this one.
        this.prevArrowVisible(false);
      }
      this.boards.setCurrentBoardById(boards[1].board_id);
      var currentBoardId = this.boards.getCurrentBoardId();
      this._remoteService.getBoardData(currentBoardId);
    }
    this.onPreviousBoardRecieved = this.onPreviousBoardRecieved.bind(this);



}; // end view model.

  return {
    viewModel: BlackboardViewModel,
    template: template
  }

});


define('text!auth/template.html',[],function () { return '<link rel="stylesheet" href="./styles/components/auth/style.css"></link>\n\n\n<div id="auth-holder" data-bind="visible:isVisible()">\n\n  <img  id="logo" src="./styles/components/auth/logo.png" >\n    <div id="company-text">\n      Live math help for York Students\n    </div>\n\n    <div class="landing-page-background-image">\n    </div>\n\n    <div id="signup-holder" data-bind="visible:signupPageVisible()">\n      <div class="input-holder" data-bind="visible: !activationEmailSent()">\n      <div style="position:relative">\n        <input class="auth-input" placeholder="First name" id="firstName" type="text"\n               data-bind="textInput:firstName, enterKey: signUp, hasFocus:invokeSignupFormEndowment"/>\n        <span data-bind="visible: isFirstNameValid()"  class="check-mark glyphicon glyphicon-ok"></span>\n      </div>\n\n      <div id="last-name-holder" style="position:relative;">\n        <input class="auth-input" placeholder="Last name" id="lastName" type="text" data-bind="textInput:lastName, enterKey: signUp"/>\n        <span data-bind="visible: isLastNameValid()"  class="check-mark glyphicon glyphicon-ok"></span>\n      </div>\n\n\n      <div style="position:relative;">\n\n        <input class="auth-input"\n               autocorrect="off"\n               autocapitalize="none"\n               autofocus placeholder="Email"\n               id="signup-email"\n               type="text"\n               data-bind="textInput:email, enterKey: signUp"/>\n\n\n        <span data-bind="visible: isEmailValid()"\n              class="check-mark glyphicon glyphicon-ok">\n        </span>\n\n      </div>\n\n      <div style="position:relative;">\n        <input class="auth-input" placeholder="Password" id="password-signup" type="password" data-bind="textInput:password ,enterKey: signUp" />\n\n        <!-- Quick Feedback -->\n        <span data-bind="visible: isPasswordValid()"\n              class="check-mark glyphicon glyphicon-ok">\n\n        </span>\n        <span id="signup-password-caution-mark"\n              data-bind="visible: !isPasswordValid() && password().length > 0">\n\n                  <div id="signup-password-callout"\n                       class="callout">\n\n                      <b id="signup-password-error-msg"\n                         class="callout-msg"\n                         data-bind="text:invalidPasswordMessage">\n\n                      </b>\n                      <b class="notch">\n                      </b>\n                  </div>\n        </span>\n      </div>\n\n      <button id="signup-btn"\n              class="auth-btn"\n              data-bind="click:signUp">\n              Signup</button>\n\n\n\n      <button\n            class="glyphicon glyphicon-menu-left back-to-login-page-button"\n            data-bind="click: goToLoginPage">\n      </button>\n\n\n      <div id="terms-and-conditions">By signing up you are agreeing to the\n          <a href="https://www.legal.palolo.ca/terms_and_conditions">\n            terms and conditions\n          </a>\n\n      </div>\n\n\n\n      </div>\n    </div>\n\n\n\n\n<!-- Login Page  -->\n\n        <div id="login-holder"\n             style="color:white"\n             data-bind="visible: loginPageVisible()">\n          <div class="input-holder">\n\n          <div style="position:relative;">\n\n\n\n\n\n\n            <input class="auth-input"\n                   autocorrect="off"\n                   autocapitalize="none"\n                   autofocus placeholder="Email"\n                   id="email"\n                   type="text"\n                   data-bind="textInput:email, enterKey: login"/>\n\n            <span data-bind="visible:  isEmailValid()"\n                  class="check-mark glyphicon glyphicon-ok">\n            </span>\n\n\n\n\n          </div>\n\n          <div style="position:relative;">\n            <input class="auth-input" placeholder="Password" id="password-login" type="password" data-bind="textInput:password ,enterKey: login" />\n            <span data-bind="visible: isPasswordValid()"  class="check-mark glyphicon glyphicon-ok"></span>\n\n            <!--Quick feedback  -->\n\n            <span id="login-password-caution-mark"\n                  data-bind="visible: !isPasswordValid() && password().length > 0"\n                  class="caution-mark glyphicon glyphicon-exclamation-sign">\n\n                      <div id="login-password-callout"\n                           class="callout">\n\n                          <b id="login-password-error-msg"\n                             class="callout-msg"\n                             data-bind="text:invalidPasswordMessage">\n\n                          </b>\n                          <b class="notch">\n                          </b>\n                      </div>\n            </span>\n\n          </div>\n\n          <button id="login-btn"\n                  class="auth-btn"\n                  data-bind="click:login"\n                  >Login</button>\n\n\n          <div id="or-signup">or</div>\n          <button\n                id="signup-button"\n                data-bind="click:goToSignupPage">\n          Signup\n          </button>\n          </div>\n\n\n        </div>\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n        <div id="signup-spinner"\n             class="middelize"\n             data-bind=visible:spinner()>\n            <div class="big-loader"></div>\n        </div>\n\n\n <!-- Activation Email Sent!  -->\n        <div id="email-sent-page"\n             data-bind="visible: activationEmailSentPageVisible()"\n             class="middelize">\n\n          <div id="activation-email-sent-msg">\n            Activation email sent.\n          </div>\n          <div id="activation-email-sent-instructions">\n            Please check your email to complete\n            your account activation.\n          </div>\n        </div>\n\n\n\n\n        <!-- Password reset stuff. -->\n        <div data-bind="visible:errorMessage().length > 0">\n              <div class="error-msg"\n                   data-bind="text:errorMessage">\n              </div>\n              <div class="auth-clickable"\n                   data-bind="click:goToPasswordResetState">\n                   reset password\n                </div>\n        </div>\n\n\n\n\n        <!-- Password Reset Page -->\n\n            <div id="password-reset-holder"\n                  style="color:white"\n                  data-bind="visible:resetPasswordVisible()">\n\n              <div class="input-holder">\n              <div style="position:relative;">\n                <input class="auth-input"\n                       autocorrect="off"\n                       autocapitalize="none"\n                       autofocus placeholder="Email"\n                       id="reset-email"\n                       type="text"\n                       data-bind="textInput:email"/>\n\n                <span data-bind="visible:  isEmailValid()"\n                      class="check-mark glyphicon glyphicon-ok">\n                </span>\n              </div>\n\n\n\n              <button id="send-reset-email-btn"\n                      class="auth-btn"\n                      data-bind="click:submitResetEmail"\n                      >Submit</button>\n\n              <button\n                    id="password-reset-page-back-button"\n                    class="glyphicon glyphicon-menu-left back-to-login-page-button"\n                    data-bind="click:goToLoginPage"\n                    data-toggle="tooltip"\n                    title="Back">\n              </button>\n              </div>\n              <div class="error-msg"\n                   data-bind="text:malformedEmailError">\n              </div>\n            </div>\n\n\n            <!--  Email Sent! -->\n            <div\n                 data-bind="visible: resetPasswordEmailSentPageVisible()"\n                 class="middelize">\n\n              <div id="activation-email-sent-msg">\n                Reset email sent.\n              </div>\n              <div id="activation-email-sent-instructions">\n                Check your email to complete\n                resetting your password.\n              </div>\n            </div>\n\n\n\n\n            <!-- <div id="conformity-banner"> Over 250 registered York Students.</div> -->\n\n    </div>\n\n</div>\n';});

 define('auth/AuthRemoteService',['ActiveRemoteService'],
function(ActiveRemoteService){

  var AuthRemoteService = function(){

    Object.setPrototypeOf(this, new ActiveRemoteService());

    this.constructor = AuthRemoteService;
    this.constructor.name = "AuthRemoteService";
    this.getConstructorName = function(){
      return "AuthRemoteService";
    }

    this.setMicroServer('auth');
    this.setPath('Auth.php');
    this.setPort('');


      /**
        expects json return which contains
        the userId and token.
      */
      this.checkIfCurrentTokenIsValid = function(){
        var token = this.getAccessToken();
        if(typeof this.onTokenAnalyzed != 'function'){
          throw new Error('Callback has not been set.');
        }
        if(!token || token == 'null'){
          this.onTokenAnalyzed(false);
        }
        var url  = this.getServerURL();
        $.ajax({
            type:'POST',
            url:url,
            withCredentials: true,
            data:{
              action:'verifyToken',
              token:token
            },
            success:this.onTokenAnalyzed,
            error:function(err){
              console.log(err);
            }
          })
      } // end function.


      this.registerOnTokenVerified = function(callback){
        if(typeof callback != 'function'){
          throw new Error('callback must be function.');
        }
        this.onTokenAnalyzed = callback;
      }



  }


  return AuthRemoteService;
})
;

define('auth/states/AuthState',[],
function(){

  function AuthState(context){

    if(!context){

      throw new Error('context must be injected into authstate, but it is undefined');
    }
    else if(!context.triggerUpdate){

      throw new Error('context needs triggerUpdate function');
    }

    // move this state data into its own class!
    this.activationEmailSent = false;
    this.authServer = null;
    this.context = context;
    this.email = "";
    this.errorMessage = "";
    this.localErrorMessage = {
      passwordError:"",
      wrongEmail:""
    }
    this.firstName = '';
    this.MIN_PASSWORD_LENGTH = 8;
    this.isVisible = true;
    this.isEmailValid = false;
    this.isPasswordValid = false;
    this.lastName = '';
    this.password = "";
    this.spinner = false;
    this.endowSignupForm = false;


    this.getConstructorName = function(){
      throw new Error("getConstructorName must be implemented in a subclass.");
    }


    this.validateRemoteService = function(remoteService){

      if(!remoteService || remoteService.getConstructorName() != "AuthRemoteService"){
        throw new Error("AuthRemoteService must be injected.");
      }
    }


    this.signUp = function(){
      throw new Error('cant signup when your not on the signup screen');
    }

    this.login = function(){
      throw new Error('cant execute abstract login function');
    }


    this.submitResetEmail = function(){
      throw new Error('cant execute abstract submitResetEmail function');
    }

    this.isFirstNameValid = false;



     this.validateEmail = function(email){
       var regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+\s*$/;
       var isValidEmail = regex.test(email);
       var isAYorkUniversityEmail = /.*yorku\.ca/.test(email);
       if(isValidEmail == false || isAYorkUniversityEmail == false){
         this.isEmailValid = false;
       }
       else{
         this.isEmailValid = true;
       }
     }
     this.validateEmail = this.validateEmail.bind(this);

     this.setEmail = function(email){
       this.validateEmail(email);
       this.email = email;
     }

     this.validatePassword = function(callback){
       var self = this;
       return function(password){
         var numRegex = /\d/;
         var whiteSpaceRegex = /\s/;
         var alphaRegex = /[a-zA-Z]/;
        if(password.length < self.MIN_PASSWORD_LENGTH){
           callback('Password is too short.');
         }
         else if(!alphaRegex.test(password)){
           callback('Password must have at least 1 letter.');
         }
         else if(!numRegex.test(password)){
           callback('Password must have at least one number.');
         }
         else if(whiteSpaceRegex.test(password)){
           callback('Password can\'t have any spaces.');
         }
         else{
           callback('success');
         }
       }
     }
     this.validatePassword = this.validatePassword.bind(this);

     this.passwordValidateCallback = function(msg){
         if(msg == 'success'){
              this.isPasswordValid = true;
         }
         else{
            this.isPasswordValid = false;

            this.localErrorMessage.passwordError = msg;
         }
     }

     this.passwordValidateCallback = this.passwordValidateCallback.bind(this);

      this.setPassword = function(password){
        this.validatePassword(this.passwordValidateCallback)(password);
        this.password = password;
      }

      // sets the next state of this state.
      // i.e: when this state transitions to the next state,
      // this is the state that is transitioned too.
      this.setNextState = function(state){
          if(Object.getPrototypeOf(state).constructor.name !== 'AuthState'){
            throw new Error('State must be a decendant of AuthState');
          }
          this._nextState = state;
      }

      this.goToNextState = function(){
      }
};

  return AuthState;

}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */


define('auth/states/SignupState',['auth/states/AuthState'],

function(AuthState){

  function SignupState(context, remoteService){


    Object.setPrototypeOf(this,new AuthState(context));

    this.validateRemoteService(remoteService);
    this.isVisible = true;
    this.endowSignupForm = true;
    this.remoteService = remoteService;
    this.constructor = SignupState;

    this.getConstructorName = function(){
      return "SignupState";
    }



    // unique too this state.
    this.EXPECTED_SIGNUP_RESPONSE = 'Activation email sent.';

    this.nameRegex = /^[a-zA-Z]{2,}$/

    this.activationEmailSent = false;
    this.firstName = "";
    this.isFirstNameValid = false;
    this.lastName = "";





    this.validateFirstName = function(name){

        var isValid = this.nameRegex.test(name);
        if(!isValid){
          this.isFirstNameValid = false;
        }
        else{
          this.isFirstNameValid = true;
        }
    }
    this.validateFirstName = this.validateFirstName.bind(this);

    this.setFirstName = function(name){
      this.validateFirstName(name);
    }



    this.validateLastName = function(name){
      var isValid = this.nameRegex.test(name);
      if(!isValid){
        this.isLastNameValid = false;
      }
      else{
        this.isLastNameValid = true;
      }
    }
    this.validateLastName = this.validateLastName.bind(this);

    this.setLastName = function(name){
      this.validateLastName(name);
      this.lastName = name;
    }








    this.signUp = function(){

      this.spinner = true;

      var creds =   {

            action:'createNewUser',
            first:this.firstName,
            last:this.lastName,
            email:this.email,
            password:this.password
        }



        $.ajax({
              type:'POST',
              url:this.remoteService.getServerURL(),
              crossDomain: true,
              data:creds,
              success:this.onSignupCallback
            })
        this.context.triggerUpdate();
    }

    this.signUp = this.signUp.bind(this);

    // this.signUpObject =




    this.onSignupCallback = function(response){

      this.spinner = false;

      var decoded = JSON.parse(response);

      if(decoded === this.EXPECTED_SIGNUP_RESPONSE){

        this.activationEmailSent = true;

      }
      else{

        this.activationEmailSent = false;
        this.errorMessage = decoded;
      }

      this.context.triggerUpdate();
    }
    this.onSignupCallback = this.onSignupCallback.bind(this);






}; // end SignupState constructor.


  return SignupState;


}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */


define('auth/states/LoginState',['auth/states/AuthState'],

function(AuthState){

  function LoginState(context,remoteService){



    Object.setPrototypeOf(this,new AuthState(context));
    this.validateRemoteService(remoteService);
    this.remoteService = remoteService;
    this.constructor = LoginState;
    this.getConstructorName = function(){
      return "LoginState";
    }
    this.isVisible = true;

    this.login = function(){


    var obj =   {
          action:'login',
          email:this.email,
          password:this.password
      }
      $.ajax({
            type:'POST',
            url:this.remoteService.getServerURL(),
            withCredentials: true,
            data:obj,
            success:this.onLoginCallback,
            error:this.onLoginError
          })

    }

    this.login = this.login.bind(this);



    this.onLoginCallback = function(response){
      this.spinner = false;
      try{
        this.context.onTokenAnalyzed(response);
        this.context.triggerUpdate();
      }
      catch(err){
        console.log(err);
      }
    }
    this.onLoginCallback = this.onLoginCallback.bind(this);



    this.onLoginError = function(err){
      this.spinner = false;
      this.errorMessage = err.responseText;
      this.context.triggerUpdate();
    }
    this.onLoginError = this.onLoginError.bind(this);

}; // end LoginState constructor.

  return LoginState;
}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */


define('auth/states/SentResetEmailState',['auth/states/AuthState'],

function(AuthState){

  function SentResetEmailState(context,remoteService){



    Object.setPrototypeOf(this,new AuthState(context));

    this.validateRemoteService(remoteService);

    this.remoteService = remoteService;

    this.constructor = SentResetEmailState;

    this.getConstructorName = function(){
      return "SentResetEmailState";
    }

    this.isVisible = true;




}; // end SentResetEmailState constructor.


  return SentResetEmailState;


}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */


define('auth/states/ActivationEmailSentState',['auth/states/AuthState'],

function(AuthState){

  function ActivationEmailSentState(context,remoteService){



    Object.setPrototypeOf(this,new AuthState(context));
    this.validateRemoteService(remoteService);
    this.remoteService = remoteService;
    this.constructor = ActivationEmailSentState;

    this.getConstructorName = function(){
      return "ActivationEmailSentState";
    }
    this.isVisible = true;
    // override.
    this.activationEmailSent = true;



}; // end ActivationEmailSentState constructor.


  return ActivationEmailSentState;


}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */


define('auth/states/PasswordResetState',['auth/states/AuthState'],

function(AuthState){

  function PasswordResetState(context,remoteService){

    Object.setPrototypeOf(this,new AuthState(context));
    this.validateRemoteService(remoteService);
    this.remoteService = remoteService;
    this.constructor = PasswordResetState;

    this.getConstructorName = function(){
      return "PasswordResetState";
    }
    /**
     * To be performed when the response from the server is recieved.
     * on 200 OK responses only.
     */
    this.onResetPasswordCallback = function(jsonResponse){
      var response = JSON.parse(jsonResponse);
      console.log(response);
      if(response == 'success'){
        this.spinner = false;
        this.context.gotoSentResetEmailState();
      }
    }
    this.onResetPasswordCallback = this.onResetPasswordCallback.bind(this);

    /**
     * Handles what happens if the response status isn't 200.
     */
    this.onResetPasswordError = function(xhr,b,c,testMode){
        this.spinner = false;
        console.log(xhr.responseText);
        this.localErrorMessage.wrongEmail = xhr.responseText;
        this.context.triggerUpdate();
    }
    this.onResetPasswordError = this.onResetPasswordError.bind(this);


    /**
     * Asks the server to send a password reset email to the owner
     * of the given email address.
     */
    this.submitResetEmail = function(){
      var obj = {
        action:'resetPassword',
        email:this.email
      }
      // console.log("attempting to reset password for:" + obj.email);
      $.ajax({
            type:'POST',
            url:this.remoteService.getServerURL(),
            withCredentials: true,
            data:obj,
            success:this.onResetPasswordCallback,
            error:this.onResetPasswordError
          })
        this.spinner = true;
        this.context.triggerUpdate();
    }



}; // end PasswordResetState constructor.

  return PasswordResetState;
}); // end define.
;
/**
 * the only part that knows all the auth states.
 *
 * So this is really the state transitioner.
 *
 */
define('auth/StateBuilder',['auth/states/SignupState',
        'auth/states/LoginState',
        'auth/states/SentResetEmailState',
        'auth/states/ActivationEmailSentState',
        'auth/states/PasswordResetState'],

function(SignupState,
         LoginState,
         SentResetEmailState,
         ActivationEmailSentState,
         PasswordResetState){

 var StateBuilder = function(remoteService, viewModel){


   if(!remoteService || !viewModel){

     throw new Error('Both remoteService and viewModel must be injected.');
   }

    this._context = viewModel;



    this.states = [];


    this.getContext = function(){

      return this._context;
    }



    this.getState = function(name){

      for(var i = 0; i < this.states.length; i++){

        if(this.states[i].constructor.name == name){

          return this.states[i];
        }
      }

      return null;


    }


    this.buildInitialState = function(context){

      return this.buildLoginState(context);
    }





    this.build = function(state, context){

      var cachedState = this.getState(state);
      if(cachedState){
        return cachedState;
      }

      switch(state){

        case "LoginState":
          var state = this.buildLoginState(context);
          this.states.push(state);
          return state;
        break;


        case "SignupState":
          var state = new SignupState(context,remoteService);
          this.states.push(state);
          return state;
        break;

        case "ActivationEmailSentState":
          var state = new ActivationEmailSentState(context,remoteService);
          this.states.push(state);
          return state;
        break;

        case "PasswordResetState":
          var state = new PasswordResetState(context,remoteService);
          this.states.push(state);
          return state;
        break;


        case "SentResetEmailState":
          var state = new SentResetEmailState(context,remoteService);
          this.states.push(state);
          return state;
        break;


        default:
          return this.buildLoginState(context);
        break;
      }

    }


    this.buildLoginState = function(context){

      var state = new LoginState(context,remoteService);

      this.states.push(state);

      return state;
    }


    /**
     *
     * precondition: The state already exists in the array of states.
     *
     * Switches to the next state for the given state.
     */
    this.setNextStateOf = function(state, nextState){

      state.setNextState(nextState);

    }



    /**
     *   Foces the context to switch to the
     *   next state from the current state.
     *
     * e.g: if the current state is the login state
     * then it transitions to the signup state.
     */
    this.goToNextState = function(){

        //
        // var currentState = this._context.state();
        //
        // this._context.state(currentState.getNextState());
    }



};

  return StateBuilder;

}); // end define.
;
/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */


define('auth/AuthViewModel',['jquery',
        'ko',
        'dispatcher/Dispatcher',
        'text!auth/template.html',
        'auth/AuthRemoteService',
        'auth/StateBuilder'],
function($,
         ko,
         Dispatcher,
         template,
         AuthRemoteService,
         StateBuilder){

  function AuthViewModel(params, componentInfo){


    this.isVisible = ko.observable(false).extend({notify:'always'});
    this.authState = ko.observable('anonymous');
    this._dispatcher = new Dispatcher();
    this._remoteService = new AuthRemoteService();
    this.stateBuilder = new StateBuilder(this._remoteService, this);
    this.errorTimeout = 8000;
    this._userId = -1;



    this.setUserId = function(id){
      if(!id || isNaN(id) || id < 1){
        throw new Error('id must be a postive integer.');
      }
      this._userId = id;
    }
    this.setUserId = this.setUserId.bind(this);

    this.authStateCallback = function(state){
      if(state === 'authenticated'){
          this._dispatcher.dispatch('authState', {
            id:this._userId,
            state:state
          });
      }
    }
    this.authStateCallback = this.authStateCallback.bind(this);
    this.authStateSubscription = this.authState.subscribe(this.authStateCallback);


    this.onLogout = function(testMode){
      this._remoteService.deleteToken();
      // this._remoteService.checkIfCurrentTokenIsValid();
      if(!testMode){
        location.reload();
      }
    }
    this.onLogout = this.onLogout.bind(this);
    this._dispatcher.reg('logout',this.onLogout);


    /**
     * Whenever an attribute of a state changes that
     * is not an observable, this must be called.
     */
    this.triggerUpdate = function()  {
      this.state.valueHasMutated();
    }
    this.triggerUpdate = this.triggerUpdate.bind(this);

    var initialState = this.stateBuilder.buildInitialState(this);
    this.state = ko.observable(initialState);


    this.activationEmailSent = ko.computed(function(){
      var isSent = this.state().activationEmailSent;
      if(isSent){
        this.goToActivationEmailSentPage();
      }
      return isSent;
    },this).extend({notify:'always'});


    this.onTokenAnalyzed = function(json){
      try{
        var idTokenPair = JSON.parse(json);
        if(!idTokenPair || Array.isArray(idTokenPair) === false){
          this.isVisible(true);
          this._remoteService.deleteToken();
          this.authState('anonymous');
        }
        else{  // token is valid.

          var userId = idTokenPair[0];
          this.setUserId(userId);

          var token = idTokenPair[1];
          this._remoteService.setAccessToken(token);

          this.authState('authenticated');
          this.isVisible(false);
        }
      }
      catch(err){
        console.log(err);
      }
    }
    this.onTokenAnalyzed = this.onTokenAnalyzed.bind(this);



    this.email = ko.computed({
      read:function(){
          return this.state().email;
      },
      write:function(newEmail){
          this.state().setEmail(newEmail);
          // have to force the update because
          // on the State instance, email is
          // not an observable.
          this.state.valueHasMutated();
      },
      owner:this
    }).extend({ notify: 'always' });





    this.errorMessage = ko.computed({
      read:function(){
        return this.state().errorMessage;
      },
      write:function(value){
        this.state().errorMessage = value;
      },
      owner:this
    }).extend({notify:'always'});





    this.timerDone = true;

    this.clearErrorCallback = function(){
      this.errorMessage('');
      this.triggerUpdate();
      this.timerDone = true;
    }
    this.clearErrorCallback = this.clearErrorCallback.bind(this);


    this.errorSubscribeCallback = function() {

      if(this.timerDone){
        this.timerDone = false;
        setTimeout(this.clearErrorCallback,this.errorTimeout);
      }
    }

    this.errorSubscribeCallback = this.errorSubscribeCallback.bind(this);
    this.errorMessage.subscribe(this.errorSubscribeCallback);





    this.firstName = ko.computed({
      read:function(){
        return this.state().firstName;
      },
      write:function(value){
        this.state().firstName = value;
      },

      owner: this
    }).extend({notify:'always'});




    this.isEmailValid = ko.computed({
      read:function(){
        return this.state().isEmailValid;
      },
      write:function(value){
        this.state().isEmailValid = value;
      },
      owner:this
    });

    this.isFirstNameValid = ko.computed(function() {
      return this.state().isFirstNameValid;
    },this).extend({notify:'always'});


    this.isLastNameValid = ko.computed(function() {
      return this.state().isLastNameValid;
    },this);



    this.lastName = ko.computed({
      read:function(){
          return this.state().lastName;
      },
      write: function(value){
        this.state().lastName = value;
      }
    },this).extend({notify:'always'});


    this.login = function() {

      this.state().login();
    }



    this.loginPageVisible = ko.computed({
      read:function(){
          return this.state().getConstructorName() == "LoginState" && false == this.activationEmailSent();
      },
      write: function(value){

      },
      owner:this

    }).extend({notify:'always'});


    this.resetPasswordVisible = ko.computed({

      read:function(){

        return this.state().constructor.name == "PasswordResetState";
      },
      write: function(value){

      },
      owner:this
    }).extend({notify:'always'});




    this.resetPasswordEmailSentPageVisible = ko.computed({

      read:function(){
        return this.state().constructor.name == "SentResetEmailState";
      },
      write: function(value){

      },
      owner:this
    }).extend({notify:'always'});




    this.password = ko.computed({
        read:function(){
          return this.state().password;
        },
        write:  function(password){
          this.state().setPassword(password);
          this.state.valueHasMutated();
        },
        owner:this
    })




    this.signUp = function() {
      this.state().signUp();
    }


    this.signupPageVisible =  ko.computed(function() {

      return this.state().constructor.name == "SignupState";
    },this);


    this.injectSignupPageCallback = function(callback){

      this.signupPageVisible.subscribe(callback);
    }




    this.submitResetEmail =  function(){
      this.state().submitResetEmail();
    }


    this.spinner = ko.computed(function() {
      return this.state().spinner;
    },this);



    this.activationEmailSentPageVisible = ko.computed(function(){
      return this.state().constructor.name == "ActivationEmailSentState";
    },this);




    this.isPasswordValid = ko.computed(function() {
        return this.state().isPasswordValid;
    },this).extend({notify:'always'});



    this.invalidPasswordMessage = ko.computed(function(){
      return this.state().localErrorMessage.passwordError;
    },this).extend({notify:'always'});


    this.malformedEmailError = ko.computed(function(){
      return this.state().localErrorMessage.wrongEmail;

    },this).extend({notify:'always'});

    this.invokeSignupFormEndowment = ko.computed(function(){
      return this.state().endowSignupForm;
    },this);


 // make a whole other object whose responsibility is transitions.
// just get it working then refactor the design!

    this.goToSignupPage = function() {
      this.state(this.stateBuilder.build("SignupState",this));
    }

    this.goToActivationEmailSentPage = function(){

      this.state(this.stateBuilder.build("ActivationEmailSentState", this));
    }

    this.goToLoginPage = function() {
      this.state(this.stateBuilder.build("LoginState",this));
      // this.signupPageVisible(false);
    }


    this.goToPasswordResetState = function(){
      this.state(this.stateBuilder.build("PasswordResetState",this));
    }


    this.gotoSentResetEmailState = function(){
      this.state(this.stateBuilder.build("SentResetEmailState",this));
    }
    this._remoteService.registerOnTokenVerified(this.onTokenAnalyzed);
    this._remoteService.checkIfCurrentTokenIsValid();
}; // end AuthViewModel constructor.


return {
    viewModel: AuthViewModel,
    template :template
};


}); // end define.
;

define('text!session/template.html',[],function () { return '<link rel="stylesheet" href="./styles/components/session/style.css">\n\n  <div id="session-tracking-controls"\n       data-bind="visible:isSessionTimerControlsVisible()">\n\n    <div id="session-timer-dialog"\n         data-bind="visible:isSessionTimerDialogVisible(),\n                    complementClick: hideTimerDialog">\n\n\n      <div  class="screen-center-outer">\n       <div class="screen-center-inner">\n          <div id="blackboard-loader"\n               class="loader"\n               data-bind="visible:spinnerShown()"></div>\n       </div>\n     </div>\n\n     <div id="session-dialog-title">\n       Time Recorder\n     </div>\n\n      <table id="timer-recorder-table">\n        <tr>\n          <td>Course:</td>\n          <td>\n            <select id="course-selector"\n                    data-bind="value: selectedGroupId,\n                               options: courses,\n                               optionsText: \'description\',\n                               optionsValue: \'courseId\'">\n            </select>\n\n          </td>\n        </tr>\n        <tr>\n          <td>\n            Start Time:\n          </td>\n          <td>\n                <input type="time" step="15" data-bind="value:startTime" required></input>\n          </td>\n        </tr>\n        <tr>\n          <td>\n            Duration:\n          </td>\n          <td>\n            <input data-bind="sliderValue: sessionDuration"\n                   class="duration-slider"\n                   type="range"\n                   list="tickmarks"\n                   value="90"\n                   min="0"\n                   max="180"\n                   step="15"/>\n          </td>\n        </tr>\n\n        <tr>\n          <td>\n            <button id="session-timer-save-button"\n                    class="session-timer-dialog-button"\n                    data-bind="click:save, enable:isSaveButtonVisible()">\n              Save\n            </button>\n          </td>\n          <td>\n            <span id="timer-text"\n                  data-bind="text:formattedSessionDuration">\n            </span>\n          </td>\n        </tr>\n      </table>\n\n\n\n\n\n\n            <datalist id="tickmarks" >\n              <option class="tick" value="0">\n              <option class="tick" value="15">\n              <option class="tick" value="30">\n              <option class="tick" value="45">\n              <option class="tick" value="60">\n              <option class="tick" value="75">\n              <option class="tick" value="90">\n              <option class="tick" value="105">\n              <option class="tick" value="120" >\n              <option class="tick" value="135">\n              <option class="tick" value="150">\n              <option class="tick" value="165">\n              <option class="tick" value="180">\n            </datalist>\n\n\n\n    </div>\n\n\n\n    <button data-toggle="tooltip"\n            title="Session Timer"\n            class="session-tracking-button"\n            data-bind="click:showTimerDialog">\n      <i class="glyphicon glyphicon-time"></i>\n    </button>\n  </div>\n';});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('session/states/InitialState',[],function(){

  var InitialState = function (){
    this.isStartButtonVisible = true;
    this.getConstructorName = function(){
      return 'InitialState';
    }
  };


  return InitialState;

});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('session/states/SessionRunning',[],function(){

  var SessionRunning = function (){
    this.isStartButtonVisible = false;
    this.isPausedTimerVisible = true;
    this.getConstructorName = function(){
      return 'SessionRunning';
    }
  };


  return SessionRunning;

});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('session/states/SessionPaused',[],function(){

  var SessionPaused = function (){
    this.isStartButtonVisible = false;
    this.getConstructorName = function(){
      return 'SessionPaused';
    }
  };


  return SessionPaused;

});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('session/states/SessionStopped',[],function(){

  var SessionStopped = function (){

    this.getConstructorName = function(){
      return 'SessionStopped';
    }
  };


  return SessionStopped;

});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('session/states/StarRatingState',[],function(){

  var StarRatingState = function (){
    this.isStarRatingPromptVisible = true;
    this.getConstructorName = function(){
      return 'StarRatingState';
    }
  };


  return StarRatingState;

});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('session/states/Student',[],function(){

  var InitialState = function (){

    this.getConstructorName = function(){
      return 'Student';
    }
  };


  return InitialState;

});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('session/SessionRemoteService',['RemoteService',
       'jquery',],
function(RemoteService,
         $){

  var SessionRemoteService = function (){


    Object.setPrototypeOf(this, new RemoteService());

    this.setDevHost('session.');
    this.setDevDomain('localhost');
    this.setDevPort('');

    // https://www.session.palolo.ca/user/role/c
    this.setLiveHost('www.session.');
    this.setLivePort(':443');


    this._ajaxCallbacks = {};

    this.getConstructorName = function(){
      return 'SessionRemoteService';
    }

    this.registerOnSessionSaved = function(callback){
      this._ajaxCallbacks['onTutorSavedSession'] = callback;
    }


    this.emitTutorSavedSession = function(friendId, startTime, duration, courseId){
      if(isNaN(friendId)){
        throw new Error('friendId must be a number.');
      }
      var str = '/users/' + friendId +
                '/courseId/' + courseId +
                '/startTime/' + startTime +
                '/duration/' + duration;
      var url = this.getServerURL() + str;
      var self = this;
      return $.ajax({
        url:url,
        type:'POST',
        beforeSend:this.setAuthorizationHeader,
        success:function(JSONResponse){
          var responseObject = JSON.parse(JSONResponse);
          self._ajaxCallbacks['onTutorSavedSession'](responseObject);
        },
        error:function(xhr, status, error) {
          console.log(xhr.responseText);
          alert(xhr.responseText);
        }
      });
    }






    this.registerOnRole = function(callback){
      this._ajaxCallbacks['onUserRoleReceived'] = callback;
    }

    this.queryUserRole = function(){
                                  //   /user/role/:token
      var url = this.getServerURL() + '/user/role/' + this.getAccessToken();
      return $.ajax({
        url:url,
        type:'GET',
        beforeSend:this.setAuthorizationHeader,
        success:this._ajaxCallbacks['onUserRoleReceived'],
        error:function(a,b,err){
          console.log(err);
        }
      });
    }


    this.getCourses = function(){
      var url = this.getServerURL() + '/tutorable_courses';
      return $.ajax({
        url:url,
        type:'GET',
        beforeSend:this.setAuthorizationHeader,
        success:this._ajaxCallbacks['onCoursesReceived'],
        error:function(a,b,err){
          console.log(err);
        }
      });
    }

    this.registerOnCoursesReceived = function(fn){
      this._ajaxCallbacks['onCoursesReceived'] = fn;
    }
    this.registerOnCoursesReceived = this.registerOnCoursesReceived.bind(this);


  };
  return SessionRemoteService;

});


define('session/TimeFormatter',[],

function(){

  var TimeFormatter = function(params,componentInfo){


    this.toString = function(dur){
      var MINUTE = 1;
      var HOUR = MINUTE * 60;
      var DAY = HOUR * 24;

      var hours = Math.floor((dur % DAY) / HOUR);
      var minutes = Math.floor((dur % HOUR) / MINUTE);
      return hours + "h " +
             this.fixWidthToTwo(minutes) + "m"; // +
    }
    this.toString = this.toString.bind(this);



    this.fixWidthToTwo = function(number){
      return ("00" + number).substr(-2,2);
    }
    this.fixWidthToTwo = this.fixWidthToTwo.bind(this);

  }

return TimeFormatter;


});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('session/Component',['ko',
        'postbox',
        'text!session/template.html',
        'session/states/InitialState',
        'session/states/SessionRunning',
        'session/states/SessionPaused',
        'session/states/SessionStopped',
        'session/states/StarRatingState',
        'session/states/Student',
        'session/SessionRemoteService',
        'session/TimeFormatter'],

function(ko,
         postbox,
         template,
         InitialState,
         SessionRunning,
         SessionPaused,
         SessionStopped,
         StarRatingState,
         Student,
         SessionRemoteService,
         TimeFormatter){

  function ViewModel(params,componentInfo){

    this.userState = ko.observable('anonymous').subscribeTo('userState');
    this.currentFriendId = ko.observable(null).subscribeTo('focusedUser');
    this.state = ko.observable(new InitialState());
    this.isSessionTimerControlsVisible = ko.observable(false);
    this.isSessionTimerDialogVisible = ko.observable(false);
    this.spinnerShown = ko.observable(false);
    this.courses = ko.observableArray([]);
    this.selectedGroupId = ko.observable();


    this._remoteService = new SessionRemoteService();
    this.currentSessionId = null;
    this.timeFormatter = new TimeFormatter();

    this.startTime = ko.observable();

    this.formattedSessionDuration = ko.observable('1h 30m');
    this.sessionDuration = ko.observable(90);
    this.sessionDuration.subscribe(function(minutes){
      var formattedTime = this.timeFormatter.toString(minutes);
      this.formattedSessionDuration(formattedTime);
    },this);





    this.getCurrentStateName = function(){
      return this.state().getConstructorName();
    }
    this.getCurrentStateName = this.getCurrentStateName.bind(this);

    this.getCurrentSessionId = function(){
      return this.currentSessionId;
    }

    this.showTimerDialog = function(){
      this.isSessionTimerDialogVisible(true);
    }
    this.showTimerDialog = this.showTimerDialog.bind(this);

    this.hideTimerDialog = function(){
      this.isSessionTimerDialogVisible(false);
    }
    this.hideTimerDialog = this.hideTimerDialog.bind(this);



    this.isSaveButtonVisible = ko.computed(function(){
      return true;
    },this);


    this.interpretUserAuthorizationState = function(authState){
      if(authState == 'authenticated'){
        this._remoteService.registerOnSessionSaved(this.onSessionSaved);
        this._remoteService.registerOnRole(this.onRoleReceived);
        this._remoteService.registerOnCoursesReceived(this.onCoursesReceived);
        this._remoteService.queryUserRole();
      }
    }
    this.userState.subscribe(this.interpretUserAuthorizationState,this);



    this.onRoleReceived = function(role){
      if(role == 'admin' || role == 'tutor'){
        this.isSessionTimerControlsVisible(true);
        this._remoteService.getCourses();
      }
    }
    this.onRoleReceived = this.onRoleReceived.bind(this);


    this.onCoursesReceived = function(courses){
        courses = JSON.parse(courses);
        for(var i = 0; i < courses.length; i++){
          this.courses.push(courses[i]);
        }
    }
    this.onCoursesReceived = this.onCoursesReceived.bind(this);


    this.onSessionSaved = function(response){
      if(response.message == "Session saved"){
        alert("Session Saved!");
      }
    }
    this.onSessionSaved = this.onSessionSaved.bind(this);


    // JQuery Tutoring Session Confirmation
    //
    // Address:     105 The Pond Rd, North York, ON M3J 0K9
    // Time:        5:30pm
    // Instructor:  Chris Kerley


    /**
     * State Transition Functions.
     */
    this.save = function(){
      var fId = this.currentFriendId();
      var sTime = this.startTime();
      var dur = this.sessionDuration();
      var cId = this.selectedGroupId();
      this._remoteService.emitTutorSavedSession(fId,sTime,dur,cId);
    }
    this.save = this.save.bind(this);



  }; // end viewModel.



  return {
    viewModel: ViewModel,
    template : template
  }


});


define('text!environment/template.html',[],function () { return '\n\n<link rel="stylesheet"\n      href="./styles/components/environment/style.css">\n\n<div  id="connection-lost-alert"\n      data-bind="visible:showConnectionLost()">\n  <div>Internet Disconnected</div>\n</div>\n\n\n<div id="no-mobile-holder"\n     data-bind="visible:showDeviceNotSupportedMessage()">\n  <div id="no-mobile-message">\n    <div>Sorry this website is not mobile friendly.</div>\n    <img  id="no-mobile-math-joke"\n          src="https://i.pinimg.com/originals/6f/a2/b3/6fa2b37c7165c9cdc061b6b1f599f543.jpg">\n    </img>\n    <div id="desktop-laptop-prompt">\n          Please try again on your laptop or desktop computer.\n    </div>\n  </div>\n</div>\n';});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('environment/Component',['ko',
        'dispatcher/Dispatcher',
        'text!environment/template.html'],
function(ko,
         Dispatcher,
         template){

  function InternetHeartBeatViewModel(params, componentInfo){

    this._dispatcher = new Dispatcher();
    this.showConnectionLost = ko.observable(false);
    this.showDeviceNotSupportedMessage = ko.observable(false);
    this.MIN_WIDTH = 500;

    this.onAuthUpdate = function(update){
      if(update.state == 'authenticated'){
        this.isSupportedDevice() ? this.showDeviceNotSupportedMessage(false) : this.showDeviceNotSupportedMessage(true);
      }
    }
    this.onAuthUpdate = this.onAuthUpdate.bind(this);
    this.authStateId = this._dispatcher.reg('authState', this.onAuthUpdate);

    this.onOffline = function(){
      this.showConnectionLost(true);
    }
    this.onOffline = this.onOffline.bind(this);
    window.addEventListener('offline',this.onOffline);

    this.onOnline = function(){
      this.showConnectionLost(false);
    }
    this.onOnline = this.onOnline.bind(this);
    window.addEventListener('online', this.onOnline);

    this.getWindowWidth = function(){
      return window.innerWidth;
    }

    this.isSupportedDevice = function() {
      var device = navigator.userAgent;
      var width = this.getWindowWidth();
      // console.log('innerWidth:' + width);

     if(device.match(/iPod/i)){
        return false;
      }
      else if(width < this.MIN_WIDTH){
        return false;
      }
     else {
        return true;
      }
    }

};

return {
    viewModel: InternetHeartBeatViewModel,
    template :template
};


}); // end define.
;

define('text!search/template.html',[],function () { return '\n<link rel="stylesheet" href="./styles/components/search/style.css"></link>\n\n<div id="first-time-user"\n     data-bind="visible:isFirstTimeUsePromptVisible()">\n  <div id="first-time-user-prompt">\n    <i class="caret prompt-caret"></i>\n    <span>Type your course code.</span>\n  </div>\n</div>\n\n<div id="search-bar-holder"\n     data-bind="visible:searchVisible()">\n\n  <input id="search-bar"\n         type="text"\n         placeholder="Enter your course code."\n         data-bind="textInput:query,\n                    hasFocus: searchInputHasFocus,\n                    click:getSearchHistory">\n  </input>\n\n  <!-- spinner -->\n  <span  id="pal-list-spinner"\n          data-bind="visible:isSpinnerVisible()">\n    <div  class="screen-center-outer">\n     <div class="screen-center-inner">\n        <div class="small-spinner">\n        </div>\n     </div>\n   </div>\n  </span>\n\n  <button type="button"\n          id="search-button"\n          class="btn search-button",\n          data-bind="css: { \'orange-button\': searchInputHasFocus()}">\n     <span class="glyphicon glyphicon-search">\n     </span>\n   </button>\n\n\n  <ul class="course-code-search-results"\n      data-bind="foreach:matches, complementClick:clearSearchResults">\n    <li class="course-code-search-result"\n        data-bind="click:$parent.selectCourse">\n        <div data-bind="text:course_code + \' \' + section_letter + \' \' + description"></div>\n    </li>\n  </ul>\n\n\n  <div id="recent-search-holder"\n       data-bind="visible:recentSearches().length > 0">\n    <div style="width:fit-content;">\n      <div id="recent-searches-title">\n        Recent Searches\n      </div>\n      <ul class="course-code-search-results"\n          data-bind="foreach:recentSearches, complementClick:clearHistoryResults">\n        <li class="course-code-search-result"\n            data-bind="click:$parent.selectCourse">\n            <div data-bind="text:course_code + \' \' + section_letter + \' \' + description, "></div>\n        </li>\n      </ul>\n  </div>\n\n  </div>\n\n\n  <div  id="search-match-message"\n        data-bind="text:matchMessage, visible:matchMessage().length > 0">\n  </div>\n</div>\n';});



define('search/SearchRemoteService',['ActiveRemoteService','jquery','dispatcher/Dispatcher'],
function(ActiveRemoteService, $, Dispatcher){

  var SearchRemoteService = function(){
      Object.setPrototypeOf(this,new ActiveRemoteService());
      this.setMicroServer('search');
      this.dis = new Dispatcher();

      this.getCoursesMatching = function(courseCode, grpId){
        var url = this.getServerURL() + '/courses?course=' + courseCode + '&grpId=' + grpId;
        return $.ajax({
          url:url,
          type:'get',
          beforeSend:this.setAuthorizationHeader,
          success:this.onCourseMatchesReceived,
          error:function(a,b,err){
            console.log(err);
          }
        });
      }
      this.getCoursesMatching = this.getCoursesMatching.bind(this);



      this.registerOnCourseMatchesReceived = function(fn){
        this.onCourseMatchesReceived = fn;
      }


      this.recordSelection = function(courseId){

        var url = this.getServerURL() + '/selectedCourse/' + courseId;
        $.ajax({
          url:url,
          type:'post',
          beforeSend:this.setAuthorizationHeader,
          success:function(result){
            console.log(result);
          },
          error:function(err){
            console.log(err);
          }
        })
      }


      this.registerOnSearchHistoryReceived = function(callback){
        this.inSearchHistoryReceived = callback;
      }
      this.registerOnSearchHistoryReceived = this.registerOnSearchHistoryReceived.bind(this);



      this.getHistory = function(grpId){
        var url = this.getServerURL() + '/history?excludeGrpId='+ grpId;
        $.ajax({
          url:url,
          type:'get',
          beforeSend:this.setAuthorizationHeader,
          success:this.inSearchHistoryReceived,
          error:function(a,b,err){
            console.log(res.responseText);
            console.log(err);
          }
        })
      }
      this.getHistory = this.getHistory.bind(this);
      this.getHistId = this.dis.reg('getSearchHistory', this.getHistory);
  }
  return SearchRemoteService;

})
;

define('search/Component',['ko',
        'postbox',
        'text!search/template.html',
        'search/SearchRemoteService',
        'dispatcher/Dispatcher'],

function(ko,
         postbox,
         template,
         SearchRemoteService,
         Dispatcher){

  function ViewModel(params, componentInfo){

    this.dis = new Dispatcher();

    this.isFirstTimeUsePromptVisible = ko.observable(false).syncWith('courseSelectionHistoryExists');
    this.searchVisible = ko.observable(false);
    this.recentSearches = ko.observableArray([]);
    this.query = ko.observable('');
    this.matches = ko.observableArray([]);
    this.matchMessage = ko.observable('');
    this.searchInputHasFocus = ko.observable(true);
    this.isSpinnerVisible = ko.observable(false);
    this.currentGroupId = null;


    this.onFirstTimeUsePrompt = function(boolean){
      if(boolean){
        this.searchInputHasFocus(boolean);
      }
    }
    this.isFirstTimeUsePromptVisible.subscribe(this.onFirstTimeUsePrompt, this)


    this.onGroupInfo = function(group){
      this.currentGroupId = group.getId();
    }
    this.onGroupInfo = this.onGroupInfo.bind(this);
    this.dis.reg('groupInfo',this.onGroupInfo);


    this.getCurrentGroupId = function(){
      return this.currentGroupId;
    }

    this.setCurrentGroupId = function(grpId){
      this.currentGroupId = grpId;
    }

    this.onQueryEntered = function(query){
      if(query.length > 0){
        this.remoteService.getCoursesMatching(query, this.getCurrentGroupId());
      }
      else{
        this.matches([]);
        this.matchMessage('');
      }
    }
    this.onQueryEntered = this.onQueryEntered.bind(this);
    this.query.subscribe(this.onQueryEntered,this);

    this.remoteService = new SearchRemoteService();


    this.clearSearchResults = function(){
      this.matches([]);
      this.matchMessage('');
      this.query('');
    }
    this.clearSearchResults = this.clearSearchResults.bind(this);


    this.clearHistoryResults = function(){
      this.recentSearches([]);
    }
    this.clearHistoryResults = this.clearHistoryResults.bind(this);


    this.selectCourse = function(data, event){
      var groupId = data.group_id;
      this.dis.dispatch('selectedGroupId',groupId);
      this.matches([]);
      this.recentSearches([]);
      this.query('');
      this.isFirstTimeUsePromptVisible(false);

      this.remoteService.recordSelection(data.group_id);
    }
    this.selectCourse = this.selectCourse.bind(this);



    this.onAuth = function(update){
      if(update.state == 'authenticated'){
        this.remoteService.registerOnCourseMatchesReceived(this.onCourseMatchesReceived);
        this.remoteService.registerOnSearchHistoryReceived(this.onHistoryReceived);
        this.searchVisible(true);
      }
    }
    this.onAuth = this.onAuth.bind(this);
    this.dis.reg('authState', this.onAuth);



    this.onCourseMatchesReceived = function(matches){
      this.recentSearches([]);
      var parsedJSON = JSON.parse(matches);
      if(parsedJSON.length < 1){
        this.matches([]);
        this.matchMessage('No matches.');
      }
      else{

        this.matches(parsedJSON);
        this.matchMessage('');
      }
    }
    this.onCourseMatchesReceived = this.onCourseMatchesReceived.bind(this);


    this.getSearchHistory = function(){
      this.isSpinnerVisible(true);
      this.dis.dispatch('getSearchHistory', this.getCurrentGroupId());
    }


    this.onHistoryReceived = function(jsonHistory){
      var history = JSON.parse(jsonHistory);
      if(history.length > 0){
        if(isNaN(history[0].group_id) || typeof history[0].course_code != 'string'){
          throw new Error('Each course object must have a group_id number and a course_code.');
        }
      }

      if(history.length < 1){
        this.recentSearches([]);
        this.matchMessage('No previous searches.');
      }
      else{
        this.recentSearches(history);
        this.matchMessage('');
      }
      this.isSpinnerVisible(false);
    }
    this.onHistoryReceived = this.onHistoryReceived.bind(this);


  }; // end viewModel.



  return {
    viewModel: ViewModel,
    template : template
  }


});


define('text!group-title/template.html',[],function () { return '\n<link rel="stylesheet" href="./styles/components/group-title/group-title.css"></link>\n\n  <div id="section-letter-holder"\n      data-bind="click:openGroupView, css: { \'group-view-selected\': isGroupViewOpen() }">\n      <!-- ko if:courseGroup() -->\n      <span id="course-section-text"\n             data-bind="text:courseGroup().getCourseCode() + \' \' + courseGroup().getSectionLetter()">\n        Home\n      </span>\n      <!-- /ko -->\n  </div>\n';});


define('group-title/Component',['ko',
        'text!group-title/template.html',
        'dispatcher/Dispatcher',
        'course/CourseStore'],

function(ko,
         template,
         Dispatcher,
         Store){

  function ViewModel(){

    this.dis = new Dispatcher();
    this.store = Store;
    this.courseGroup = ko.observable(null);
    this.isGroupViewOpen = ko.observable(true);


    this.onStoreChange = function(){
      this.courseGroup(this.store.getCurrentGroup());
      this.isGroupViewOpen(this.store.isGroupViewVisible());
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.subscribe(this.onStoreChange);

    this.openGroupView = function(){
      this.dis.dispatch('showGroupView');
    }



  } // end view model.

  return {
    viewModel: ViewModel,
    template : template
  }


});


define('text!pal-list/template.html',[],function () { return '<link rel="stylesheet" href="./styles/components/person-panel/pal-list.css?v=2.1">\n<div id="pal-holder">\n  <span data-bind="visible:isSpinnerVisible()">\n    <div  class="screen-center-outer">\n     <div class="screen-center-inner">\n        <div class="small-spinner">\n        </div>\n     </div>\n   </div>\n  </span>\n  <div id="no-pals-message"\n        data-bind="visible:pals().length < 1">\n    You have no friends\n  </div>\n  <ul id="pal-list"\n      data-bind="foreach:pals">\n    <li class="pal-row"\n        data-bind="css:{\'pal-row-selected\':$parent.selectedPal().getId() == getId() && $parent.selectedPal().getId() >=0}, click:$parent.palClicked">\n      <i\n          class="pal-request-accepted-message"\n          data-bind="visible:isNew()">\n          <i class="arrow-left">\n          </i>\n          You have a new friend!\n      </i>\n      <span class="pal-presence">\n        <i class="pal-last-seen centerize"\n           data-bind="visible:isPresent() == false, text:getLastSeen()">\n        </i>\n        <i class="dot presence-dot centerize"\n           data-bind="visible:isPresent()">\n         </i>\n      </span>\n      <img class="pal-img"\n           data-bind="attr:{src: getSmallPhotoURL()}">\n      </img>\n      <span class="pal-name-holder">\n        <span class="pal-name"\n              data-bind="text:getFirst() + \' \' + getLast()">\n        </span>\n      </span>\n    </li>\n  </ul>\n</div>\n';});


define('pal-list/Component',['ko',
        'text!pal-list/template.html',
        'dispatcher/Dispatcher',
        'people-models/Pal',
        'people-models/NullPerson',
        'people-store/PeopleStore'],

function(ko,
         template,
         Dispatcher,
         Pal,
         NullPerson,
         Store){

  function ViewModel(){

    this.dis = new Dispatcher();
    this.store = Store.getInstance();
    this.pals = ko.observableArray([new NullPerson()]);
    this.selectedPal = ko.observable(new NullPerson());



    this.isSpinnerVisible = ko.computed(function(){
      return this.pals().length == 1 && this.pals()[0].getConstructorName() == 'NullPerson'
    },this)




    this.onStoreUpdate = function(){
      var pals = this.store.getPalList()
      this.pals(pals);
      var focusedPerson = this.store.getFocusedPerson()
      this.selectedPal(focusedPerson)
    }
    this.onStoreUpdate = this.onStoreUpdate.bind(this);
    this.store.sub(this.onStoreUpdate);

    this.palClicked = function(pal){
      this.selectedPal(pal);
      pal._id = pal.getId();
      this.dis.dispatch('focusPerson',pal);
    }
    this.palClicked = this.palClicked.bind(this);

  } // end view model.

  return {
    viewModel: ViewModel,
    template : template
  }


});


define('text!pal-request-list/template.html',[],function () { return '<link rel="stylesheet" href="./styles/components/person-panel/pal-request-list.css?v=1.0">\n<div id="pal-request-list-holder">\n    <ul data-bind="foreach:requests" id="pal-request-list">\n      <li class="pal-request-row">\n        <span>\n          <div class="pal-img-request-holder">\n            <img class="pal-img"\n                 data-bind="attr:{src: getSmallPhotoURL()}, click:$parent.faceClicked">\n            </img>\n          </div>\n          <span class="pal-request-name-holder">\n            <span class="pal-request-name"\n                  data-bind="text:getFirst() + \' \' + getLast()">\n            </span>\n          </span>\n          <div class="pal-request-title">\n              wants to be your friend.\n          </div>\n\n\n        </span>\n\n        <span class="pal-request-button-holder">\n            <div>\n              <button data-bind="click:$parent.acceptRequest">\n                  accept\n              </button>\n              <button data-bind="click:$parent.denyRequest">\n                  deny\n              </button>\n            </div>\n        </span>\n      </li>\n    </ul>\n</div>\n';});


define('pal-request-list/Component',['ko',
        'text!pal-request-list/template.html',
        'dispatcher/Dispatcher',
        'people-models/Person',
        'people-store/PeopleStore'],

function(ko,
         template,
         Dispatcher,
         Person,
         Store){

  function ViewModel(){

    this.dis = new Dispatcher();
    this.store = Store.getInstance();
    this.requests = ko.observableArray([]);


    this.onStoreUpdate = function(){
      var requests = this.store.getPalRequests();
      this.requests(requests);
    }
    this.onStoreUpdate = this.onStoreUpdate.bind(this);
    this.store.sub(this.onStoreUpdate);


    this.acceptRequest = function(person){
      this.dis.dispatch('acceptRequest', person);
    }
    this.acceptRequest = this.acceptRequest.bind(this);

    this.denyRequest = function(person){
      this.dis.dispatch('denyRequest', person);
    }
    this.denyRequest = this.denyRequest.bind(this);

    this.faceClicked  = function(classmate){
      this.dis.dispatch('focusPerson', classmate);
    }
    this.faceClicked = this.faceClicked.bind(this);


  } // end view model.

  return {
    viewModel: ViewModel,
    template : template
  }


});


define('text!people-popups/template.html',[],function () { return '\n<link rel="stylesheet"\n      href="./styles/components/person-panel/people-popups.css?v=2.1">\n\n<i id="pal-request-sent"\n   data-bind="visible:isPalRequestSentVisible()">\n  Request sent.\n</i>\n';});

/**
 * @license Proprietary
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define('people-popups/Component',['ko',
        'dispatcher/Dispatcher',
        'text!people-popups/template.html',
        'people-store/PeopleStore'],
function(ko,
         Dispatcher,
         template,
         PeopleStore){

  function ViewModel(params,componentInfo){

    this.dis = new Dispatcher();
    this.store = PeopleStore.getInstance();
    this.isPalRequestSentVisible = ko.observable(false);

    this.onStoreUpdated = function(){
      this.isPalRequestSentVisible(this.store.isPalRequestSent());
    }
    this.onStoreUpdated = this.onStoreUpdated.bind(this);
    this.store.sub(this.onStoreUpdated);

  }; // end viewModel.

  return {
    viewModel: ViewModel,
    template : template
  }

});


// Note that requirejs is used when you want to
// 'exports' of a module to be passed as an argument to a function.
//  not the module themselves.  For example if code like this appears.
/**
if (typeof define === 'function' && define.amd) {
    define('DetectRTC', [], function() {
        return DetectRTC;
    });
}

in the module,  then use require,  otherwise use define.
*/

requirejs(['ko',
           'enterKey',
           'complementClick',
           'sliderValue',
           'RootViewModel',
            'DetectRTC'],

function(ko,
         enterKey,
         complementClick,
         sliderValue,
         RootViewModel,
         DetectRTC){
  ko.applyBindings(new RootViewModel());
});

define("/var/www/palolo/src/main.js", function(){});

