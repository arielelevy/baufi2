var express = require('express');
var router = express.Router();
const gitDirectory = global.__basedir;
var git = require('simple-git')(gitDirectory);
router.post('/', function(req, res, next) { 
  let remote = req.body.repository.homepage + ".git"
  let branch = req.body.ref
  try{
   if(gitDirectory.split('/').slice(-1)[0] === branch.split('/').slice(-1)[0]){
       git.pull(remote, branch);
    }
  }catch(err){
    console.error(err);
  }
  res.status(200).end();
});

module.exports = router;
