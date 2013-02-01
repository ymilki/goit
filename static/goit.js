var regexp;
var fetchedRepositories = false;
var repositories = new Array();


function idFromPath(path) {
    return path.replace(/-/g, '_').replace(/\//g, '_').replace(/\./g, '_');
}


function fillRepositories() {
    if (fetchedRepositories === true) {
        return;
    }
    $.getJSON('/repositories/', function(repos) {
        for (var i = 0; i < repos.length; i++) {
            var txt = "";
            var repo = repos[i];
            var id = idFromPath(repo.RelativePath);
	    obj = $("<tr id="+id+" relativePath='"+repo.RelativePath+"'>"+
	            "<td class=repo_name><a href=/repository.html#"+repo.RelativePath+">"+repo.RelativePath+"</a></td>"+
		    "<td class=repo_gitweb><a href="+repo.GitwebUrl+">Gitweb Page</a></td>"+
	            "<td class=repo_sha id="+id+"-sha></td>"+
	            "<td class=repo_author id="+id+"-author></td>"+
	            "<td class=repo_subject id="+id+"-subject></td>"+
	            "<td class=repo_date id="+id+"-date></td>"+
	            "</tr>");
            $('#repositories-table').append(obj);
        }
        fetchedRepositories = true;
        $("tr").each(function (idx, obj) {
            repositories.push($(obj));
        });
    });
}


function fillRepositorySummaries() {
    for (var i = 0; i < repositories.length; i++) {
        obj = repositories[i];
        var path = obj.attr('relativePath');
        $.getJSON('/tip/master/' + path, function(ret) {
            var repo = ret[0]; var info = ret[1];
            var id = idFromPath(repo.RelativePath);
            $("#" + id + "-sha").text(info['SHA']);
            $("#" + id + "-author").text(info['Author']);
            $("#" + id + "-date").text(info['Date']);
            $("#" + id + "-subject").text(info['Subject']);
        });
    }
}


function searchFilter() {
    for (var i = 0; i < repositories.length; i++) {
        var obj = repositories[i];
        var klass = obj.attr('class')
        if (klass == "table-header") {
            continue;
        }

        var name = obj.attr('id');
        if (regexp.test(name) === false) {
            obj.css({'display': 'none'});
        } else {
            obj.css({'display': 'table-row'});
        }
    }
}


function repositoriesReady() {
    if (fetchedRepositories == false) {
        setTimeout(repositoriesReady, 1);
        return;
    }

    var search_input = $("input#search")
    search_input.keyup(function () {
        regexp = new RegExp(idFromPath(search_input.val()), "i");
        setTimeout(searchFilter, 50);
    });
    fillRepositorySummaries();
}


function showRepository(repository, limit) {
    $.getJSON('/commits/master/'+limit+'/'+repository, function(ret) {
        var repo = ret[0]; var commits = ret[1];
        var id = idFromPath(repo.RelativePath);
        for (var i = 0; i < commits.length; i++) {
            commit = commits[i];
            obj = $("<tr id="+id+" relativePath='"+repo.RelativePath+"'>"+
	            "<td>"+commit.SHA+"</td>"+
	            "<td>"+commit.Author+"</td>"+
	            "<td>"+commit.Subject+"</td>"+
	            "<td>"+commit.Date+"</td>"+
	            "</tr>");
            $('#repository-table').append(obj);
        }
    });

    $.getJSON('/heads/'+repository, function(ret) {
        var repo = ret[0]; var heads = ret[1];
        var id = idFromPath(repo.RelativePath)
        for (var i = 0; i < heads.length; i++) {
            head = heads[i];
            console.log(head);
            obj = $("<tr id="+id+" relativePath='"+repo.RelativePath+"'>"+
	            "<td>"+head+"</td>"+
	            "</tr>");
            $('#heads-table').append(obj);
        }
    });
}


$(document).ready(function() {
    var url = $(location).attr('href').match('.*#(.*)');
    if (url && url[1].length > 0) {
        parts = url[1].match('(.*)~(.*)~(.*)')
        repository = "";
        limit = 10;
        if (parts && parts[1].length > 0 && parts[2].length > 0) {
            repository = parts[1];
            limit = parts[2];
        } else {
            repository = url[1];
        }
        showRepository(repository, limit);
    } else {
        fillRepositories();
        repositoriesReady();
    }
});
