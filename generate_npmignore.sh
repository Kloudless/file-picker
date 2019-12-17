# create .npmignore base on .gitignore
cp .gitignore .npmignore
# whitelist .gitignore and dist folder in .npmignore
# so that npm will pick these two when packing
echo '# generate by generate_npmignore.sh' >> .npmignore
echo 'storybook-common/' >> .npmignore
echo 'storybook-react/' >> .npmignore
echo 'storybook-vue/' >> .npmignore
echo '.eslintrc.js' >> .npmignore
echo '.eslintignore' >> .npmignore
echo '.bowerrc' >> .npmignore
echo 'bower.json' >> .npmignore
echo 'webpack.loader.config.js' >> .npmignore
echo 'Gruntfile.js' >> .npmignore
echo '!.gitignore' >> .npmignore
echo '!dist' >> .npmignore
echo '!react.js' >> .npmignore
echo '!vue.js' >> .npmignore
