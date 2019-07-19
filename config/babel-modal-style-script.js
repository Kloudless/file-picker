/**
 * Babel plugin to resolve src/loader/css/modal.styl
 * The plugin will transform import call into js script that
 * 1. create a style tag with input CSS as content
 * 2. Insert the style tag into document
 * 3. Make sure the style tag is only created once
 *
 * This plugin is modified from babel-plugin-stylus-compiler
 * with the help of AST Explorer https://astexplorer.net/
 */


const path = require('path');
const autoprefixer = require('autoprefixer-stylus');
const stylus = require('stylus');
const fs = require('fs');

module.exports = ({ types: t }) => ({
  visitor: {
    ImportDeclaration: (filePath, state) => {
      const { node } = filePath;
      if (node && node.source && node.source.value
          && node.source.type === 'StringLiteral'
          && node.source.value.endsWith('css/modal.styl')) {
        // read stylus file, compile to css and minimize it
        const stylusFile = path.resolve(
          path.dirname(state.file.opts.filename),
          node.source.value,
        );
        const inputStylus = fs.readFileSync(stylusFile, 'utf8');
        let css = stylus(inputStylus).use(autoprefixer()).render();
        css = css.replace(/[\n]/g, '');

        // common identifiers and string literals
        const documentIdentifier = t.identifier('document');
        const styleTagId = t.stringLiteral(
          'kloudless-file-explorer-modal-styles',
        );
        const styleTagVar = filePath.scope.generateUidIdentifier('styleTag');

        // var _styleTag = document.createElement('style');
        const createStyleTag = t.variableDeclaration(
          'var',
          [
            t.variableDeclarator(
              styleTagVar,
              t.callExpression(
                t.memberExpression(
                  documentIdentifier,
                  t.identifier('createElement'),
                ),
                [
                  t.stringLiteral('style'),
                ],
              ),
            ),
          ],
        );

        // _styleTag.setAttribute(
        //   'id', 'kloudless-file-explorer-modal-styles');
        const setTagIdAttribute = t.expressionStatement(
          t.callExpression(
            t.memberExpression(
              styleTagVar,
              t.identifier('setAttribute'),
            ),
            [
              t.stringLiteral('id'),
              t.stringLiteral('kloudless-file-explorer-modal-styles'),
            ],
          ),
        );

        // _styleTag.innerHTML = '${modal.styl}'
        const setStyleTagInnerHtml = t.assignmentExpression(
          '=',
          t.memberExpression(
            styleTagVar,
            t.identifier('innerHTML'),
          ),
          t.stringLiteral(css),
        );

        // document.head.appendChild(_styleTag)
        const appendToHead = t.callExpression(
          t.memberExpression(
            t.identifier('document.head'),
            t.identifier('appendChild'),
          ),
          [styleTagVar],
        );

        // wrap above scripts in if(!document.getElementById(styleTagId))
        const condition = t.unaryExpression(
          '!',
          t.callExpression(
            t.memberExpression(
              documentIdentifier,
              t.identifier('getElementById'),
            ),
            [
              styleTagId,
            ],
          ),
        );

        const ifStatement = t.ifStatement(
          condition,
          t.blockStatement([
            createStyleTag,
            setTagIdAttribute,
            t.expressionStatement(setStyleTagInnerHtml),
            t.expressionStatement(appendToHead),
          ]),
        );

        filePath.replaceWithMultiple([ifStatement]);
      }
    },
  },
});
