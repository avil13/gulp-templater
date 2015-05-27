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
            src.push('..');
            console.log( arr_path );
        for (var i = 0; i < arr_path.length; i++) {
            if (src.indexOf(arr_path[i]) > -1) {
                arr_path.splice(i, 1);
            }
        }

        res = '/' + arr_path.join('/');
        return res;
    };

    var reTemplate = function(file_path) {
        var obj = {};
        var layout = fs.readFileSync(options.layout, 'utf8');
        // получаем исходник,
        obj['<%content%>'] = fs.readFileSync(file_path, 'utf8');
        // парсим
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