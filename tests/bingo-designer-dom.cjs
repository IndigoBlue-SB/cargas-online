const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/bingo90/index.html','utf8');
// Template contents are inert and cannot be found by document.querySelector.
const activeHtml=html.replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi,'');
const form=activeHtml.slice(activeHtml.indexOf('<form id="stripDesignerForm"'),activeHtml.indexOf('</form>',activeHtml.indexOf('<form id="stripDesignerForm"')));
for(const id of ['stripFitToPageInput','stripContentScaleInput','stripCellWidthInput','stripFitNowBtn','stripCopySourceInput','stripCopyParametersBtn']){
 assert.equal((activeHtml.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`${id} must exist once in the live document`);
 assert.ok(form.includes(`id="${id}"`),`${id} must be in the active designer form`);
}
console.log('PASS bingo startup DOM: scale and copy controls exist in active form, outside inert templates');
