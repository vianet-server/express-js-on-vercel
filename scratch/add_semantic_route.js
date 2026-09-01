const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/routes/admin/index.ts');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('semanticRouter')) {
  content = content.replace(
    "const emailRouter = require('./email');",
    "const emailRouter = require('./email');\nconst semanticRouter = require('./semantic');"
  );
  content = content.replace(
    "router.use(emailRouter);",
    "router.use(emailRouter);\nrouter.use('/semantic', semanticRouter);"
  );
  fs.writeFileSync(filePath, content, 'utf8');
}
