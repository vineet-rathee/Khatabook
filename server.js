const express=require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const app=express();

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "public")));

// middleware to load data
let data=[];
app.use((req,res,next)=>{
    fs.readFile("data.json","utf8",(err,file)=>
    {
        if(err) return res.send("error while loading data from server");
        if(file.trim()==="") data=[];
        else data=JSON.parse(file);
        next();
    })
})


// to redirect to home page
app.get("/",(req,res)=>{res.redirect("/home")});

// home render route
app.get("/home",(req,res)=>{

    let given=0;
    let taken=0;
    let number=data.length;
    
    //funtion to det total of all user
    const calc = (data)=>
    {
        data.forEach(ele => {
            ele.trans.forEach(tra =>{
                if(tra.type==="given") given+=Number(tra.amount);
                else taken+=Number(tra.amount);
            })
        });
    }
    calc(data);
    let net=given-taken;
    const obj={
        no:number,
        given:given,
        taken:taken,
        net:net,
    }

    res.render("home",{
        det:obj,
    })
})

// redirect to new add page
app.get("/newadd",(req,res)=>{
    res.render("add");
})

// new customer add route
app.post("/new",(req,res)=>{
    const id = crypto.randomUUID();
    const name =req.body.name;
    const date = new Date().toLocaleString("en-IN");
    let obj={
        id:id,
        name:name,
        date:date, 
        trans:[],
    }
    data.push(obj);
    fs.writeFile("data.json",JSON.stringify(data,null,3),(err)=>{
        if(err) return res.redirect("/error");
        res.redirect("/home")
    });
    
})

// user detail page redirect
app.get("/user",(req,res)=>{
    res.render("list",{
        data:data,
    })
})

// new transaction add route
app.post("/add",(req,res)=>{
    const {name,desc,amount,option,id}=req.body;
    const date = new Date().toLocaleString("en-IN");
    const idd = crypto.randomUUID();
    const obj={
        id:idd,
        amount:amount,
        type:option,
        date:date,
        desc:desc,
    }
    const customer = data.find(el => el.id === id);
    if(!customer)
    {
        return res.send("customer not found");
    }
    customer.trans.push(obj);
    fs.writeFile("data.json",JSON.stringify(data,null,3),(err)=>{
        if(err) return res.redirect("/error");
        console.log("Redirecting to:", `/user/${id}`);
        res.redirect(`/user/${id}`);    
    });
})

// route to load a user page
app.get("/user/:id",(req,res)=>{
    const id=req.params.id;
    const customer = data.find(el => el.id === id);
    if(!customer) {
        return res.send("Customer Not Found");
    }
    let given=0;
    let taken=0;
    for(const tr of customer.trans)
    {
        if(tr.type==="given") given+=Number(tr.amount);
        else taken+=Number(tr.amount);
    }
    let no=customer.trans.length;
    let net=given-taken;
    const obj={
        no:no,
        given:given,
        taken:taken,
        net:net,
    }
    res.render("user",{
         user:customer,
         det:obj,
    })
})

//delete a transcation
app.post("/delete/:id/:tid",(req,res)=>{
    const userid=req.params.id;
    const trid=req.params.tid;
    const customer = data.find(el => el.id === userid);
    const trans = customer.trans.filter(el=> el.id!==trid);
    customer.trans=trans;
    fs.writeFile("data.json",JSON.stringify(data,null,3),(err)=>{
        if(err) return res.redirect("/error");
        console.log("Redirecting to:", `/user/${userid}`);
        res.redirect(`/user/${userid}`);    
    });
})

// to delete the user
app.post("/delete/:id",(req,res)=>{
    const id=req.params.id;
    const arr=data.filter(el=> el.id!==id);
    data=arr;
    fs.writeFile("data.json",JSON.stringify(data,null,3),(err)=>{
        if(err) return res.redirect("/error");
        res.redirect(`/user`);    
    });
})
// server creation 
app.listen(3000);