const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');

// connecting mongoose
mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser:true});
// item schema and model
const itemSchema = {name:String};
const Item = mongoose.model("Item",itemSchema);

const cookFoodModel = new Item({name:"cookFood"});
const drinkModel = new Item({name:"drink"});
const danceModel = new Item({name:"dance"});
var defaultItemList = [cookFoodModel,drinkModel,danceModel]
// list schema and model
const listSchema = {
  name:String,
  items:[itemSchema]
}
const List = mongoose.model("List",listSchema);
app.get("/",function(req,res){

    Item.find({},function(err,foundItems){
      if (err){
        console.log(err);
      }
      else{
        if (foundItems.length === 0){
          res.render("list",{day:"Today",todo_list:[]});
        }
        res.render("list",{day:"Today",todo_list:foundItems});
      }
    });
  });

// customlist parameter
app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err,foundList){
    if (!err){
      if(!foundList){
        const list = new List({
          name: customListName,
          items:[]
        });
        list.save();
        res.redirect("/"+customListName);
      }
      else{
        res.render("list",{day:foundList.name,todo_list:foundList.items});
      }
    }
  });
});

// add the new item
app.post("/",function(req,res){
  var newTodoItemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({name:newTodoItemName});
  if (listName === "Today"){
    newItem.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});

// delete the selected item
app.post("/delete",function(req,res){
  const selectedItemId = req.body.checkedItem;
  const listName = req.body.listName;
  if (listName === "Today"){
    Item.findByIdAndRemove(selectedItemId,function(err){
      if (err){
        console.log(err);
      }
      else{
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  }
  else{
    // delete from custom list
    List.findOneAndUpdate({name:listName},{$pull: {items: {_id:selectedItemId}}},function(err,foundList){
      if (!err){
        console.log(listName);
        res.redirect("/"+listName);
      }
      else{
        console.log(err);
      }
    });
  }

});

app.listen(3000,function(){
  console.log("Server started in port 3000");
})
