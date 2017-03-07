module.exports = function (grunt) {
    var BUILD_DIR = 'build';

    grunt.initConfig({
        /* Concatenates source JavaScript files into one file. */
        concat: {
            options: {
                separator: ';'
            },
            js: {
                src: [
                    'lib/threejs/three.js',
                    'lib/threejs/OrbitControls.js',
                    'lib/threejs/DDSLoader.js',
                    'lib/threejs/MTLLoader.js',
                    'lib/threejs/OBJLoader.js',
                    'lib/threejs/Detector.js',
                    'js/viewer.js'],
                dest: BUILD_DIR + '/3dviewer.js'
            }
            /*
            css: {
                src: ['styles/3dviewer.css'],
                dest: BUILD_DIR + '/jhp.css'
            }
            */
        },
        /* Minifies the uber-JS file created by concat. */
        uglify: {
            options: {
                compress: {
                    drop_console: true
                }
            },
            files: {
                src: BUILD_DIR + '/3dviewer.js',
                dest: BUILD_DIR + '/',
                expand: true,
                flatten: true,
                ext: '.min.js'
            }
        },
        /* Minifies the stylesheet created by concat. */
        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: BUILD_DIR,
                    src: ['*.css', '!*.min.css'],
                    dest: BUILD_DIR,
                    ext: '.min.css'
                }]
            }
        },
        watch: {
            js: {
                files: ['src/**/*.js', 'styles/**/*.css'],
                tasks: [ 'concat', 'uglify', 'cssmin' ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', [ 'concat', 'uglify', 'cssmin' ]);
};
