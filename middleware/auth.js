const isLogedout = (req, res, next) => {
    if (!req.session.user) {
       next()
    } else {
        res.redirect("/home")
    }
}

const isLogged = (req, res, next) => {
    if (req.session.user) {
        req.user = req.session.user
        next()
    } else {
        res.redirect('/login')
    }
}


const loggedadmin = (req, res, next) => {
    if(req.session.admin){
        req.admin = req.session.user
        next()
    } else {
        res.redirect('/admin')
    }
}


const logoutAdmin = (req, res, next) => {
    if(!req.session.admin){
        next()
    } else {
        res.redirect('/admin/dashboad')
    }
}
const logouting = (req,res,next) => {
    req.session.destroy()
    res.redirect('/home')
    
    
    
}
const checkinguseroradmin = async (req, res, next) => {
    console.log('Middleware Executed');
    if (req.session.admin) {
        console.log('Redirecting to /admin/dashboard');
        return res.redirect("/admin/dashboard");
    } else if (req.session.user) {
        console.log('Redirecting to /home');
        return res.redirect('/home');
    } else {
        console.log('Redirecting to /home');
        res.redirect('/home');
    }
};


module.exports ={
    isLogedout,
    isLogged,
    logoutAdmin,
    loggedadmin,
    logouting,
    checkinguseroradmin,
   
    
}