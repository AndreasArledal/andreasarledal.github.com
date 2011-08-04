github = (function(){
    function render(target, repos){
        var i = 0, fragment = '', t = $(target)[0];

        for(i = 0; i < repos.length; i++)
            fragment += '<li><a href="'+repos[i].url+'">'+repos[i].name+'</a><p>'+repos[i].description+'</p></li>';

        t.innerHTML =  fragment;
    }
    return {
        showRepos: function(user, target){
            var feed = new jXHR();
            feed.onerror = function (msg,url) {
              $(target + ' li.loading').addClass('error').text("Error loading feed");
            }
            feed.onreadystatechange = function(data){
              if (feed.readyState === 4) {
                var repos = [];
                var i;
                for (i = 0; i < data.repositories.length; i++){
                  if (!data.repositories[i].fork)
                    repos.push(data.repositories[i]);
                }
                repos.sort(function(a, b){
                    var a = new Date(a.pushed_at),
                        b = new Date(b.pushed_at);

                    if (a.valueOf() == b.valueOf()) return 0;
                    return a.valueOf() > b.valueOf() ? -1 : 1;
                })
                render(target, repos)
              }
            };
            feed.open("GET","http://github.com/api/v2/json/repos/show/"+user+"?callback=?");
            feed.send();
        }
    };
})();