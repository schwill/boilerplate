import gulp from 'gulp';
import plugins from 'gulp-load-plugins';
import rupture from 'rupture';
import babelify from 'babelify';
import envify from 'envify/custom';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import config from './gulp-config.json';
import env from 'node-env-file';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';

try {
  fs.statSync('.env').isFile();
  env(path.resolve(__dirname, '.env'));
} catch (e) {
  let warning = '\nMissing .env file. Create one before continuing.\n';
  console.warn(chalk.yellow(warning));
  process.exit(0);
}

const production = process.env.NODE_ENV === 'production';
const $ = plugins();

gulp.task('server', [
  'jade.views',
  'jade.templates',
  'images',
  'stylesheets.project',
  'scripts.project',
  'scripts.vendor',
  'watch',
], () => {
  gulp.src(config.build)
  .pipe($.webserver({
    fallback: 'index.html',
    livereload: true,
    open: true,
    port: config.port
  }));
});

gulp.task('jade.views', () => {
  let locals = {
    url: process.env.url || `http://localhost:${config.port}`,
    live: production,
  };

  return gulp.src(config.jade.views.src)
    .pipe($.changed(config.build, {extension: '.html'}))
    .pipe($.if(global.isWatching, $.cached('jade')))
    .pipe($.jadeInheritance({basedir: config.jade.views.base}))
    .pipe($.filter((file) => {
      return !/\/_/.test(file.path) || !/^_/.test(file.relative);
    }))
    .pipe($.jade({
      pretty: true,
      locals: locals
    }))
    .pipe(gulp.dest(config.build))
    .pipe($.if(!production, $.notify({
      title: 'Sucess',
      message: 'Views compiled'
    })));
});

gulp.task('jade.templates', () => {
  return gulp.src(config.jade.templates.src)
    .pipe($.jade({
      client: true
    }))
    .pipe($.jadeTemplateConcat('templates.js', {
      templateVariable: 'templates'
    }))
    .pipe(gulp.dest(config.scripts.dest))
    .pipe($.if(!production, $.notify({
      title: 'Sucess',
      message: 'Templates compiled'
    })));
});

gulp.task('images', () => {
  return gulp.src(config.images.src)
    .pipe(gulp.dest(config.images.dest));
});

gulp.task('scripts.project', () => {
  return browserify({
      entries: config.scripts.project.src,
      debug: true
    })
    .transform(babelify)
    .transform(envify({
      'url': process.env.url || `http://localhost${config.port}`,
      'live': production,
    }))
    .bundle()
    .on('error', (err) => {
      console.log('Error : ' + err.message);
      this.emit('end');
    })
    .pipe(source(config.scripts.project.out))
    .pipe(buffer())
    .pipe($.if(production, $.uglify()))
    .pipe(gulp.dest(config.scripts.dest))
    .pipe($.if(!production, $.notify({
      title: 'Sucess',
      message: 'Project scripts compiled'
    })));
});

gulp.task('scripts.vendor', () => {
  return gulp.src(config.scripts.vendor.src)
    .pipe($.flatten())
    .pipe($.if(production, $.uglify()))
    .pipe($.concat(config.scripts.vendor.out))
    .pipe(gulp.dest(config.scripts.dest))
    .pipe($.if(!production, $.notify({
      title: 'Sucess',
      message: 'Vendor scripts compiled'
    })));
});

gulp.task('stylesheets.project', ['stylesheets.vendor'], () => {
  return gulp.src(config.styles.project.src)
    .pipe($.stylus({
      use: [rupture()]
    }))
    .on('error', (err) => {
      console.log(err);
      this.emit('end');
    })
    .pipe($.autoprefixer({
      browsers: config.styles.project.browsers
    }))
    .pipe($.if(!production, $.sourcemaps.init()))
    .pipe($.if(!production, $.sourcemaps.write()))
    .pipe($.if(production, $.minifyCss(config.styles.project.out)))
    .pipe(gulp.dest(config.styles.project.dest))
    .pipe($.if(!production, $.notify({
      title: 'Sucess',
      message: 'Stylus compiled'
    })));
});

gulp.task('stylesheets.vendor', () => {
  return gulp.src(config.styles.vendor.src)
    .pipe(gulp.dest(config.styles.vendor.dest));
});

gulp.task('watch', () => {
  gulp.watch(config.jade.views.src, ['jade.views']);
  gulp.watch(config.jade.templates.src, ['jade.templates']);
  gulp.watch(config.images.src, ['images']);
  gulp.watch(config.scripts.project.watch, ['scripts.project']);
  gulp.watch(config.scripts.vendor.src, ['scripts.vendor']);
  gulp.watch(config.styles.project.watch, ['stylesheets.project']);
});

gulp.task('build', [
  'jade.views',
  'jade.templates',
  'images',
  'stylesheets.project',
  'scripts.project',
  'scripts.vendor',
], () => {
  process.exit(0);
});

gulp.task('default', ['server']);
