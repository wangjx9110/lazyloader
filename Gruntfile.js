module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner:  '/*! <%= pkg.name %> <%= pkg.version%> | <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      buildSingle: {
        src: 'src/lazyloader.js',
        dest: 'build/lazyloader-<%= pkg.version %>.min.js'
      },
      buildAll: {
        files: [
          {
            expand: true,    
            cwd: './src',      
            src: ['*.js'], 
            dest: 'build/',   
            ext: '-<%= pkg.version %>.min.js',  
            extDot: 'last'
          }
        ]
      }
    },
    clean: {
      build: {
        src: ['build/*']
      }
    },
    replace: {
      build: {
        src: 'bowerTpl.json',
        dest: 'bower.json',
        data: {
          name: '<%= pkg.name %>',
          version: '<%= pkg.version %>',
          homepage: '<%= pkg.homepage %>',
          description: '<%= pkg.description %>',
          authors: '<%= pkg.author %> <<%= pkg.email %>>',
          main: 'build/lazyloader-<%= pkg.version %>.min.js'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.registerMultiTask('replace', 'fill data into the template', function() {
    grunt.config.requires([this.name, this.target]);

    var config = grunt.config([this.name, this.target]);
    var data = config.data;
    var tpl = grunt.file.read(config.src);
    for (var i in data) {
      if (data.hasOwnProperty(i)) {
        tpl = tpl.replace(new RegExp('\\${' + i + '}', 'g'), data[i]);
      }
    }
    grunt.file.delete(config.dest);
    grunt.file.write(config.dest, tpl);
  });

  grunt.registerTask('default', ['clean:build', 'uglify:buildAll', 'replace:build']);
};