var path = require('path');

var DIR = __dirname
  , EXPLORER_SRC = path.join(DIR, 'src', 'explorer')
  , LOADER_SRC = path.join(DIR, 'src', 'loader')
  , TMP_PATH = path.join(DIR, '.tmp')
  , DEST_PATH = path.join(DIR, 'dist')
  , EXPLORER_DEST = path.join(DEST_PATH, 'explorer')
  , LOADER_DEST = path.join(DEST_PATH, 'loader');

module.exports = function(grunt) {
  var inlines = {
    EXPLORER_URL: '',
    LOADER_CSS: ''
  };

  grunt.initConfig({
    // Read package.json.
    pkg: grunt.file.readJSON('package.json'),
    // Compile Jade templates.
    jade: {
      // Compile file explorer Jade templates into deployment directory.
      build: {
        files: [{
          src: path.join(EXPLORER_SRC, 'templates', 'explorer.jade'),
          dest: path.join(EXPLORER_DEST, '_explorer.html')
        }]
      }
    },
    includes: {
      files: {
        src: path.join(DIR, 'example', 'explorer.html'),
        dest: path.join(EXPLORER_DEST, 'explorer.html')
      }
    },
    // Compile Stylus files.
    stylus: {
      loader: {
        files: [{
          src: path.join(LOADER_SRC, 'css', '*.styl'),
          dest: path.join(TMP_PATH, 'css', 'loader.css')
        }],
      },
      // Compile file explorer Stylus templates into temporary directory.
      dev: {
        files: [{
          src: path.join(EXPLORER_SRC, 'css', 'file-explorer.styl'),
          dest: path.join(TMP_PATH, 'css', 'explorer.css')
        }],
        options: {
          compress: false,
          linenos: true,
          paths: [path.join(TMP_PATH, 'css')],
          "include css": true,
        },
      },
      // Compile and minify file explorer Stylus templates into temporary directory.
      deploy: {
        files: [{
          src: path.join(EXPLORER_SRC, 'css', 'file-explorer.styl'),
          dest: path.join(TMP_PATH, 'css', 'explorer.css')
        }],
        options: {
          compress: false,
          paths: [path.join(TMP_PATH, 'css')],
          "include css": true,
          use: [require('csso-stylus')],
        },
      }
    },
    // Install dependencies.
    exec: {
      load: {
        command: 'bower --config.analytics=false install || echo'
      },
    },
    // Copy files.
    copy: {
      // Copy localization files
      localization: {
        files: [{ // messages
          src: path.join('*.json'),
          cwd: path.join(DIR, 'src', 'explorer', 'localization', 'messages'),
          dest: path.join(TMP_PATH, 'localization', 'messages'),
          expand: true,
          filter: 'isFile'
        }]
      },
      // Copy vendor files from Bower into temporary directory.
      vendor: {
        files: [{
          src: [
            path.join(DIR, 'bower_components', 'foundation', 'css', 'foundation.css'),
            path.join(DIR, 'bower_components', 'foundation', 'css', 'normalize.css'),
            path.join(DIR, 'bower_components', 'jquery-dropdown', 'jquery.dropdown.css'),
          ],
          dest: path.join(TMP_PATH, 'css/'),
          flatten: true,
          expand: true,
          filter: 'isFile'
        }, {
          src: path.join(DIR, 'node_modules', 'jquery', 'dist', 'cdn', 'jquery-2.1.1.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'jquery.js')
        }, {
          src: path.join(DIR, 'bower_components', 'fastclick', 'lib', 'fastclick.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'fastclick.js')
        }, {
          src: path.join(DIR, 'bower_components', 'jquery-ui', 'ui', 'jquery-ui.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'jquery-ui.js')
        }, {
          src: path.join(DIR, 'bower_components', 'jquery-placeholder', 'jquery.placeholder.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'jquery-placeholder.js')
        }, {
          src: path.join(DIR, 'bower_components', 'jquery.cookie', 'jquery.cookie.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'jquery-cookie.js')
        }, {
          src: path.join(DIR, 'bower_components', 'jquery-dropdown', 'jquery.dropdown.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'jquery-dropdown.js')
        }, {
          src: path.join(DIR, 'bower_components', 'jquery-scrollstop', 'jquery.scrollstop.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'jquery-scrollstop.js')
        }, {
          src: path.join(DIR, 'bower_components', 'modernizr', 'modernizr.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'modernizr.js')
        }, {
          src: path.join(DIR, 'bower_components', 'knockout', 'dist', 'knockout.debug.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'knockout.js')
        }, {
          src: path.join(DIR, 'bower_components', 'requirejs', 'require.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'require.js')
        }, {
          src: path.join(DIR, 'bower_components', 'almond', 'almond.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'almond.js')
        }, {
          src: path.join(DIR, 'bower_components', 'sammy', 'lib', 'sammy.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'sammy.js')
        }, {
          src: path.join(DIR, 'bower_components', 'loglevel', 'dist', 'loglevel.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'loglevel.js')
        }, {
          src: path.join(DIR, 'bower_components', 'momentjs', 'moment.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'moment.js')
        }, {
          cwd: path.join(DIR, 'bower_components', 'requirejs-plugins'),
          src: '**/*',
          dest: path.join(TMP_PATH, 'js', 'vendor', 'requirejs-plugins'),
          expand: true,
          filter: 'isFile'
        }, {
          src: [
            'cldr.js',
            path.join('cldr', 'event.js'),
            path.join('cldr', 'supplemental.js')
          ],
          dest: path.join(TMP_PATH, 'js', 'vendor'),
          cwd: path.join(DIR, 'bower_components', 'cldrjs', 'dist'),
          expand: true,
          filter: 'isFile'
        }, {
          src: [
            'globalize.js',
            path.join('globalize', 'number.js'),
            path.join('globalize', 'date.js'),
            path.join('globalize', 'message.js')
          ],
          dest: path.join(TMP_PATH, 'js', 'vendor'),
          cwd: path.join(DIR, 'bower_components', 'globalize', 'dist'),
          expand: true,
          filter: 'isFile'
        }, {
          /*
           CLDR Data
           This is copying data from ALL of the cultures with CLDR data, but
           only the language files needed will be loaded by the browser.
           It would be possible to filter this data (i.e. replace '**' with
           something like '@(en|es)', but copying all of the available cultures
           allows additional languages to be added without modifying the
           Gruntfile (and also allows for the possibility of programatically
           adding cultures in the future).
          */
          src: [
            path.join('supplemental', 'likelySubtags.json'),
            path.join('main', '**', 'numbers.json'),
            path.join('supplemental', 'numberingSystems.json'),
            path.join('main', '**', 'ca-gregorian.json'),
            path.join('main', '**', 'timeZoneNames.json'),
            path.join('supplemental', 'timeData.json'),
            path.join('supplemental', 'weekData.json')
          ],
          dest: path.join(TMP_PATH, 'localization', 'cldr-data/'),
          cwd: path.join(DIR, 'bower_components', 'cldr-data'),
          expand: true,
          filter: 'isFile'
        }]
      },
      // Copy minified vendor files from Bower into temporary directory.
      vendor_min: {
        files: [{
          src: [
            path.join(DIR, 'bower_components', 'foundation', 'css', 'foundation.css'),
            path.join(DIR, 'bower_components', 'foundation', 'css', 'normalize.css'),
            path.join(DIR, 'bower_components', 'jquery-dropdown', 'jquery.dropdown.css'),
          ],
          dest: path.join(TMP_PATH, 'css/'),
          flatten: true,
          expand: true,
          filter: 'isFile'
        }, {
          src: path.join(DIR, 'node_modules', 'jquery', 'dist', 'cdn', 'jquery-2.1.1.min.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'jquery.js')
        }, {
          src: path.join(DIR, 'bower_components', 'fastclick', 'lib', 'fastclick.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'fastclick.js')
        }, {
          src: path.join(DIR, 'bower_components', 'jquery-ui', 'ui', 'minified', 'jquery-ui.min.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'jquery-ui.js')
        }, {
          src: path.join(DIR, 'bower_components', 'jquery-placeholder', 'jquery.placeholder.min.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'jquery-placeholder.js')
        }, {
          src: path.join(DIR, 'bower_components', 'jquery.cookie', 'jquery.cookie.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'jquery-cookie.js')
        }, {
          src: path.join(DIR, 'bower_components', 'jquery-dropdown', 'jquery.dropdown.min.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'jquery-dropdown.js')
        }, {
          src: path.join(DIR, 'bower_components', 'jquery-scrollstop', 'jquery.scrollstop.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'jquery-scrollstop.js')
        }, {
          src: path.join(DIR, 'bower_components', 'modernizr', 'modernizr.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'modernizr.js')
        }, {
          src: path.join(DIR, 'bower_components', 'knockout', 'dist', 'knockout.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'knockout.js')
        }, {
          src: path.join(DIR, 'bower_components', 'requirejs', 'require.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'require.js')
        }, {
          src: path.join(DIR, 'bower_components', 'sammy', 'lib', 'min', 'sammy-latest.min.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'sammy.js')
        }, {
          src: path.join(DIR, 'bower_components', 'loglevel', 'dist', 'loglevel.min.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'loglevel.js')
        }, {
          src: path.join(DIR, 'bower_components', 'momentjs', 'min', 'moment.min.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor', 'moment.js')
        }, {
          src: [
            'cldr.js',
            path.join('cldr', 'event.js'),
            path.join('cldr', 'supplemental.js')
          ],
          dest: path.join(TMP_PATH, 'js', 'vendor'),
          cwd: path.join(DIR, 'bower_components', 'cldrjs', 'dist'),
          expand: true,
          filter: 'isFile'
        }, {
          src: [
            'globalize.js',
            path.join('globalize', 'number.js'),
            path.join('globalize', 'date.js'),
            path.join('globalize', 'message.js')
          ],
          dest: path.join(TMP_PATH, 'js', 'vendor'),
          cwd: path.join(DIR, 'bower_components', 'globalize', 'dist'),
          expand: true,
          filter: 'isFile'
        }]
      },
      // Copy library directory into temporary directory.
      lib: {
        files: [{
          src: path.join(DIR, 'lib', '*.js'),
          dest: path.join(TMP_PATH, 'js', 'vendor/'),
          flatten: true,
          expand: true,
          filter: 'isFile',
        }, {
          cwd: path.join(DIR, 'lib'),
          src: path.join('plupload', '**'),
          dest: path.join(TMP_PATH, 'js', 'vendor/'),
          expand: true,
        }],
      },
      // Copy file explorer source directory into temporary directory.
      app: {
        files: [{
          cwd: path.join(EXPLORER_SRC, 'js'),
          src: path.join('.', '**', '*.js'),
          dest: path.join(TMP_PATH, 'js/'),
          expand: true,
          filter: 'isFile'
        }, {
          cwd: path.join(EXPLORER_SRC, 'js'),
          src: path.join('.', '**', '*.json'),
          dest: path.join(TMP_PATH, 'js/'),
          expand: true,
          filter: 'isFile'
        }]
      },
      // Copy temporary directory into deployment directory.
      deploy: {
        cwd: path.join(TMP_PATH),
        src: '**',
        dest: EXPLORER_DEST,
        expand: true
      },
      // Copy minified temporary files into deployment directory.
      deploy_min: {
        files: [{
          cwd: path.join(TMP_PATH),
          src: path.join('css', 'explorer.css'),
          dest: path.join(EXPLORER_DEST, 'css'),
          expand: true,
          flatten: true,
        }, {
          cwd: path.join(TMP_PATH),
          src: 'explorer.js',
          dest: path.join(EXPLORER_DEST, 'js'),
          expand: true,
          flatten: true,
        }, {
          cwd: path.join(TMP_PATH, 'localization'),
          src: '**',
          dest: path.join(EXPLORER_DEST, 'localization'),
          expand: true
        }, {
          cwd: path.join(TMP_PATH, 'js', 'vendor', 'plupload', 'i18n'),
          src: '**',
          dest: path.join(EXPLORER_DEST, 'js', 'vendor', 'plupload', 'i18n'),
          expand: true
        }]
      }
    },
    // Compile RequireJS dependencies.
    requirejs: {
      // Compile RequireJS dependencies from temporary directory into deployment directory.
      compile: {
        options: {
          baseUrl: path.join(TMP_PATH, 'js'),
          mainConfigFile: path.join(TMP_PATH, 'js', 'app.js'),
          name: path.join('vendor', 'almond'),
          include: ['app'],
          out: path.join(TMP_PATH, 'explorer.js'),
        }
      }
    },
    // Compile and minify JS files.
    uglify: {
      options: {
        compress: {
          global_defs: inlines
        }
      },
      // Compile file explorer JS into deployment directory.
      dev: {
        options: {
          mangle: false,
          beautify: true,
          compress: {
            sequences    : false,
            conditionals : false,
            comparisons  : false,
            booleans     : false,
            loops        : false,
            if_return    : false,
            join_vars    : false,
            cascade      : false,
            global_defs  : inlines
          }
        },
        files: [{
          src: path.join(LOADER_SRC, 'js/*.js'),
          dest: path.join(LOADER_DEST, 'js', 'loader.js'),
        }],
      },
      // Compile and minify file explorer JS into deployment directory.
      deploy: {
        files: [{
          src: path.join(LOADER_SRC, 'js/*.js'),
          dest: path.join(LOADER_DEST, 'js', 'loader.js'),
        }],
      },
    },
    // Clean temporary and deployment directories.
    clean: {
      temp: [TMP_PATH],
      deploy: [DEST_PATH],
      options: {
        force: true
      }
    },
    // Watch source files for changes.
    watch: {
      scripts: {
        files: ['src/**/*.js', 'src/**/*.jade', 'src/**/*.json', 'src/**/*.styl'],
        tasks: ['default', 'watch'],
        options: {
          spawn: false,
        },
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-includes');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadNpmTasks('grunt-exec');

  // Options
  inlines.EXPLORER_URL = grunt.option('url') || 'http://localhost:3000/file-explorer';

  // Read in loader.css
  grunt.registerTask('loader_css', "Load loader.css into memory.", function() {
    inlines.LOADER_CSS = grunt.file.read(path.join(TMP_PATH, 'css', 'loader.css'));
  });

  // Build all dependencies.
  grunt.registerTask('build', [
    'exec:load',
  ]);

  // Refresh stuff you've been developing.
  grunt.registerTask('default', [
    'clean:deploy',
    'jade',
    'includes',
    'stylus:loader',
    'stylus:dev',
    'loader_css',
    'uglify:dev',
    'copy:app',
    'copy:localization',
    'copy:deploy'
  ]);

  // Rebuild everything to dev targets.
  grunt.registerTask('dev', [
    'build',
    'copy:vendor',
    'copy:lib',
    'default'
  ]);

  // Build to deployment targets.
  grunt.registerTask('deploy', [
    'clean:deploy',
    'build',
    'copy:vendor',
    'copy:vendor_min',
    'copy:localization',
    'copy:lib',
    'jade',
    'includes',
    'stylus:loader',
    'stylus:deploy',
    'loader_css',
    'uglify:deploy',
    'copy:app',
    'requirejs',
    'copy:deploy_min',
    'clean:temp',
  ]);
};
