var presentations = [];
$.get('php/check_login.php', function(data) {
	if (data == "new" || data == "no") window.location.href = "login.html";
});

$.get("php/get_years.php", function(data) {
	data = JSON.parse(data);
	var dlen = data.length;
	for (var i=0; i<dlen; i++) {
		$("#year").append("<option value='"+data[i]+"'>"+data[i]+"</option>");
		$("#report_year").append("<option value='"+data[i]+"'>"+data[i]+"</option>");
	}
});

/*$.get('php/get_all_presentations.php', function(data) {
	data = JSON.parse(data);
	data = data["presentations"];
	presentations = data;
});*/


$("#upload_file").click(function() {
	var file = $("#file").prop("files");
	if (file.length == 0) {
		alert("Choose a file please!");
		return;
	}
	file = file[0];
	var reader = new FileReader();
	reader.onload = function() {
		var data = reader.result;
		var workbook = XLSX.read(data, {type: 'binary'});
		upload_worksheet(workbook.Sheets.export);
	}
	reader.readAsBinaryString(file);
});

function upload_worksheet(worksheet) {
	var row = {	"A":"title",
			"B":"description",
			"C":"session",
			"E":"location",
			"F":"department",
			"G":"num_members",
			"I":"mem1_first",
			"J":"mem1_last",
			"N":"mem2_first",
			"O":"mem2_last",
			"S":"mem3_first",
			"T":"mem3_last",
			"X":"mem4_first",
			"Y":"mem4_last",
			"AC":"mem5_first",
			"AD":"mem5_last",
			"AH":"mem6_first",
			"AI":"mem6_last",
			"AU":"advisor1",
			"AW":"advisor2",
	};
	var mem_loc = [
		["I","J"],
		["N","O"],
		["S","T"],
		["X","Y"],
		["AC","AD"],
		["AH","AI"]
	]
	var presentations = [];
	var keys = [];
	for (var key in worksheet) {
		keys.push(key);
	}
	keys.sort();
	var r = range(2, parseInt(keys[keys.length-1].match(/\d+/)[0])+1);
	var sessions = [];
	for (var i in r) {
		var ses = worksheet["C"+r[i]].v;
		if ($.inArray(ses, sessions) < 0)
			sessions.push(ses);
	}
	$.get("php/get_keys.php", {num:sessions.length, s: sessions}, function(data) {
		//$.get("php/download_keys.php",{data: data}, function(data) {
		//	console.log(data);	
		//});
		if (data == "die") {
			alert("Something went wrong. Try again");
			return;
		}
		var keys = $.parseJSON(data);
		var keys_c = $.parseJSON(data);
		var sess_info = {};
		
		var number = 0;
		var previous = "0";
		r = range(2, parseInt(worksheet["!ref"].match(/\d+/g)[1]));
		for (var i in r) {
			var key = worksheet["C"+r[i]].v;
			var val = keys[key];
			var members = [];
			for (j in range(0,worksheet["G"+r[i]].v)) {
				members.push(worksheet[mem_loc[j][0]+r[i]].v + " " + worksheet[mem_loc[j][1]+r[i]].v);
			}
			var advisors = [];
			if ("AU"+r[i] in worksheet)
				advisors.push(worksheet["AU"+r[i]].v);
			if ("AW"+r[i] in worksheet)
				advisors.push(worksheet["AW"+r[i]].v);
			console.log(worksheet["D"+r[i]].v);
			console.log(previous);
			console.log(previous < worksheet["D"+r[i]].v)
			
			if (previous < worksheet["D"+r[i]].v) {
				previous = worksheet["D"+r[i]].v;
				number++;
			} else {
				previous = "0";
				number = 1;
				console.log(r[i]);
			}
			console.log(number);
			presentations.push({
				"title":worksheet["A"+r[i]].v,
				"members":members,
				"advisors":advisors,
				"department":worksheet["F"+r[i]].v,
				"number":number,
				"key":val
			});
			if (key in keys_c) {
				sess_info[val] = {
					"session":key,
					"room":worksheet["E"+r[i]].v
				}
				delete keys_c[key]
			}
		}
		$.post("php/set_presentations.php", {data:'{"presentations":'+JSON.stringify(presentations)+',"sessioninfo":'+JSON.stringify(sess_info)+"}"}, function(data) {
			alert("File uploaded Successfully!");
		});
	});
}

function range(start, end) {
	var array = new Array();
	for (var i=start; i<end; i++)
		array.push(i);
	return array;
}
