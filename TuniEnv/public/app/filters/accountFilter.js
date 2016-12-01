/**
 * Created by medna on 10/11/2016.
 */
app.filter('account',function () {
    return function (accounts,search) {
        if(accounts)
        for(var i=0; i<accounts.length;i++)
            if(accounts[i].email==search || accounts[i].username==search)
                return i;

        return -1;

    }
});