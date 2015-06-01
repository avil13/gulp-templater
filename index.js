// 'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var fs = require('fs');
var mkdirp = require("mkdirp");
var getDirName = require("path").dirname;

//экспортируем функцию, вызывая которую в тасках gulp, пользователь инициирует наш плагин
module.exports = function(options) {

    //#section инициализация
    options = options || {
        layout: '', // путь до шаблона
        dist: '', // путь начальной папки
        source: '' // путь до корня страниц
    };
    //#endsection инициализация
    var strtr = function(str, replacePairs) {
        str = str + '';
        var key, re;
        for (key in replacePairs) {
            if (replacePairs.hasOwnProperty(key)) {
                re = new RegExp(key, "g");
                str = str.replace(re, replacePairs[key]);
            }
        }
        return str;
    };


    function writeFile(path, contents, cb) {
        mkdirp(getDirName(path), function(err) {
            if (err) return cb(err);
            fs.writeFile(path, contents, cb);
        });
    }

    var newPath = function(file_path) {
        var dir = process.cwd(),
            new_path = file_path.split(dir),
            arr_path = (dir + '/' + options.dist + new_path[1]).split('/'),
            src = options.source.split('/'),
            res;
        src.push('');
        src.push('.');
        for (var i = arr_path.length - 1; i >= 0; i--) {
            if (src.indexOf(arr_path[i]) > -1) {
                arr_path.splice(i, 1);
            }
        }

        res = '/' + arr_path.join('/');
        console.log(res);
        return res;
    };

    var parse = function(tmpl) {
        var obj = {},
            t2 = tmpl.split('====='),
            t3, t4;

        if (t2.length === 1) {
            obj['<%content%>'] = t2[0];
        } else if (t2.length === 2) {
            obj['<%content%>'] = t2[1];
            t3 = t2[0].split("\n");
            for (var i = 0; i < t3.length; i++) {
                t4 = t3[i].split(':');
                obj['<%' + t4[0] + '%>'] = t4[1];
            }
        }
        return obj;
    };

    var reTemplate = function(file_path) {
        // получаем исходник,
        var layout = fs.readFileSync(options.layout, 'utf8');
        // парсим
        var obj = parse(fs.readFileSync(file_path, 'utf8'));
        // соединяем с шаблоном
        var res = strtr(layout, obj);
        // записываем
        writeFile(newPath(file_path), res, function(err) {
            if (err) console.log(err);
        });
    };

    //функция, которую будет вызывать through для каждого файла
    function bufferContents(file, enc, callback) {
        if (file.isStream()) {
            //бросим ошибку с помощью gulp-util
            this.emit('error', new gutil.PluginError('gulp-templater', 'Streams are not supported!'));
            return callback();
        }
        if (file.isBuffer()) {
            //отдадим файл на чтение нашему читателю модулей ангуляра
            reTemplate(file.path);
        }
        callback();
    }

    //функция вызывающаяся перед закрытием стрима
    function endStream(callback) {
        // this.push(htmlFile);
        callback();
    }

    return through.obj(bufferContents, endStream);
};