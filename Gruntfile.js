module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner:  '/*! <%= pkg.name %> <%= pkg.version%> | <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/lazyloader.js',
        dest: 'build/lazyloader-<%= pkg.version %>.min.js'
      }
    },
    clean: {
      build: {
        src: 'build/*'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['clean:build', 'uglify:build']);
};