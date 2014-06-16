var xeit = (function () {
    "use strict";

    function parse(doc) {
		var $doc = $(doc);
		var html = doc.documentElement.outerHTML;
        if (doc.getElementById('XEIViewer') || (html.indexOf('PrintObjectTag') > -1 && html.indexOf('XEIViewer') > -1)) {
            return {
                func: 'init',
                opts: { plugin: 'SoftForum' },
                args: [
                    html,
                    $doc.find('param[name="smime_header"]').val(),
                    $doc.find('param[name="smime_body"]').val(),
                    $doc.find('param[name="info_msg"]').val(),
                    $doc.find('param[name="ui_option"]').val(),
                    $doc.find('param[name="ui_desc"]').val()
                ]
            };
        } else if (doc.getElementById('IniMasPluginObj') || (html.indexOf('activeControl') > -1 && html.indexOf('IniMasPlugin') > -1)) {
            //HACK: IE에서만 동작하는 activeControl() (function.js) 이슈 회피.
            var body = html.replace(
                /activeControl\(([\s]*['"])/,
                "var activeControl = function (a, b, c) {" +
                    "var d = document.createElement('div');" +
                    "d.innerHTML = \"<OBJECT ID='IniMasPluginObj'>\" + a;" +
                    "d.firstChild.innerHTML = b + c;" +
                    "document.getElementById('embedControl').appendChild(d);" +
                "}($1"
            ).replace(
                /^[\s\S]*<body.*?>|<\/body>[\s\S]*$/ig,
                ''
            );
            //$doc.empty().append($.parseHTML(body, true));			
			while (doc.firstChild)
			doc.removeChild(doc.firstChild);
			doc.open();
			doc.write(body);
			doc.close();
			//아 그런데 이러면 postMessage 또 받게 되네...; postMessage 받고 나서 해당 스크립트 노드 제거 필요. 노드에 xeitPost id 넣자

            return {
                func: 'init',
                opts: { plugin: 'IniTech' },
                args: [
                    html,
                    $doc.find('param[name="IniSMContents"]').val(),
                    $doc.find('param[name="Question"]').val(),
                    $doc.find('param[name="AttachedFile"]').val()
                ]
            };
        } else if (doc.getElementById('IniCrossMailObj')) {
            return {
                func: 'init',
                opts: { plugin: 'IniTech' },
                args: [
                    html,
                    $doc.find('param[name="IniSMContents"]').val(),
                    $doc.find('param[name="Question"]').val(),
                    $doc.find('param[name="AttachedFile"]').val(),
                    $doc.find('param[name="OptData"]').val()
                ]
            };
        } else if (doc.getElementById('JXCEAL')) {
            return {
                func: 'init',
                opts: { plugin: 'Soft25' },
                args: [
                    html,
                    $doc.find('#JSEncContents').val()
                ]
            };
        } else if (doc.getElementById('MailDec')) {
            return {
                func: 'init',
                opts: { plugin: 'Natingtel' },
                args: [
                    html,
                    $doc.find('param[name="DocumentMail"]').val()
                ]
            };
        } else {
            return {
                func: 'init',
                opts: { plugin: 'Vendor' },
                args: []
            }
        }
    }

    function check(doc) {
        //HACK: <object> 태그의 상위 노드로써 DOM에 임시로 추가하여 query 수행.
        //var $doc = $('<div>', { id: 'Xeit-temp' }).hide().appendTo($('body')).append($.parseHTML(html));
        var info = parse(doc);
        return info;
    }

    var worker = new Worker('js/worker.js');
    function work(func, opts, args, success, failure) {
        var messageHandler = function (e) {
            if (e.data.func == func) {
                success(e.data.resp);
                removeHandlers();
            }
        };
        worker.addEventListener('message', messageHandler);

        var errorHandler = function (e) {
            failure(e);
            removeHandlers();
        };
        worker.addEventListener('error', errorHandler);

        function removeHandlers() {
            worker.removeEventListener('message', messageHandler);
            worker.removeEventListener('error', errorHandler);
        }

        worker.postMessage({
            func: func,
            opts: opts,
            args: args
        });
    }

    return {
        init: function (doc, success, failure) {
            var info = check(doc);
            work(info.func, info.opts, info.args, success, failure);
        },

        load: function (password, success, failure) {
            work('load', {}, [password], success, failure);
        }
    };
})();
