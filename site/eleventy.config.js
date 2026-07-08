// Eleventy config for the Auto Cal landing / self-hosting site.
// Output is deployed to GitHub Pages at https://cubicecho.github.io/auto-cal/,
// so everything is served under the /auto-cal/ path prefix. Use the `| url`
// filter on every internal link/asset so paths stay correct there and in dev.

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ 'src/css': 'css' });
  eleventyConfig.addPassthroughCopy({ 'src/nojekyll': '.nojekyll' });

  eleventyConfig.addFilter('year', () => '2026');

  eleventyConfig.setServerOptions({
    showAllHosts: true,
    host: '0.0.0.0',
    port: 8080,
  });

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    pathPrefix: '/auto-cal/',
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    templateFormats: ['njk', 'md'],
  };
}
