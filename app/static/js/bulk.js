var parse = document.getElementById("parse");
var textarea = document.getElementsByTagName('textarea')[0];
var table = document.getElementsByTagName("table")[0].getElementsByTagName('tbody')[0];
var submit = document.getElementById("submitData");
var back = document.getElementById("back");
var inputDiv = document.getElementById("input");
var submitDiv = document.getElementById("submit");
	
	parse.onclick=function(e){
		var data = textarea.value
		var rows = data.split("\n");
		console.log(rows)

		for(var y in rows) {
		    var cells = rows[y].split("\t");
		    var row = table.insertRow(table.rows.length);

		    for (var i = cells.length - 1; i >= 0; i--) {
		    	var newCell  = row.insertCell(0);
		    	var newText  = document.createTextNode(cells[i])

				var input = document.createElement("input");
				input.type = "text";
				input.value = cells[i];
				input.innerHTML = cells[i]
				newCell.appendChild(input);
		    };
		}
		hydeInput();
	};

	var hydeInput = function(){
		inputDiv.style.display = "none";
		submitDiv.style.display = "block";
	}

	back.onclick=function(){
		inputDiv.style.display = "block";
		submitDiv.style.display = "none";
		var child = document.getElementsByTagName("tr");

		// for (c in child){
		// 	table.removeChild(c);
		// }
	}
	submit.onclick=function(){
		// alert("Thanks, Your Data has been Submited")
		// var rows = table.rows
		// for(row in rows){
		// 	// for(cell in row.cells){
		// 		console.log(row.cells)
		// 	// }
		// }
		var Entity = {};
		var allEntitites = [];
        for (var r = 1, n = table.rows.length; r < n; r++) {
        	var entity = {
        		name: table.rows[r].cells[0].getElementsByTagName("input")[0].value,
        		nickname: table.rows[r].cells[1].getElementsByTagName("input")[0].value,
        		location: table.rows[r].cells[2].getElementsByTagName("input")[0].value,
        		influence: table.rows[r].cells[3].getElementsByTagName("input")[0].value,
        		type: table.rows[r].cells[4].getElementsByTagName("input")[0].value,
        		website: table.rows[r].cells[5].getElementsByTagName("input")[0].value,
        		twitter: table.rows[r].cells[6].getElementsByTagName("input")[0].value,
        		employees: table.rows[r].cells[7].getElementsByTagName("input")[0].value,
        		revenue: table.rows[r].cells[8].getElementsByTagName("input")[0].value,
        		revenueYear: table.rows[r].cells[9].getElementsByTagName("input")[0].value,
        		expenses: table.rows[r].cells[10].getElementsByTagName("input")[0].value,
        		expensesYear: table.rows[r].cells[11].getElementsByTagName("input")[0].value
        	}
            // for (var c = 0, m = table.rows[r].cells.length; c < m; c++) {
            // 	// if (table.rows[r].cells[c].getElementsByTagName("input")[0]){
            // 	var cellData = table.rows[r].cells[c].getElementsByTagName("input")[0].value;
            //     // console.log(table.rows[r].cells[c].getElementsByTagName("input")[0].value);
            //     e.cellData = cellData;
            //     // }
            // }
            allEntitites.push(entity);
        }
        console.log(allEntitites);


		// console.log(table.rows[2].cells[2].getElementsByTagName("input")[0].value)
		// var data = "";
	}

	
// 	function getTextAreaSelection(textarea) {
//     var start = textarea.selectionStart, end = textarea.selectionEnd;
//     return {
//         start: start,
//         end: end,
//         length: end - start
//         // text: textarea.value.slice(start, end)
//     };
// }

// function detectPaste(textarea, callback) {
//     textarea.onpaste = function() {
//         var sel = getTextAreaSelection(textarea);
//         var initialLength = textarea.value.length;
//         window.setTimeout(function() {
//             var val = textarea.value;
//             var pastedTextLength = val.length - (initialLength - sel.length);
//             var end = sel.start + pastedTextLength;
//             callback({
//                 start: sel.start,
//                 end: end,
//                 length: pastedTextLength,
//                 text: val.slice(sel.start, end)
//             });
//         }, 0.1);
//     };
// }

// var textarea = document.getElementsByTagName("input");
// for(var i=0; i< textarea.length; i++) {
//    	detectPaste(textarea[i], function(pasteInfo) {
//     	console.log(pasteInfo.text);
//     // pasteInfo also has properties for the start and end character
//     // index and length of the pasted text
// 	});
// }


// var data = $('input[name=excel_data]').val();
// var rows = data.split("\n");

// var table = $('<table />');

// for(var y in rows) {
//     var cells = rows[y].split("\t");
//     var row = $('<tr />');
//     for(var x in cells) {
//         row.append('<td>'+cells[x]+'</td>');
//     }
//     table.append(row);
// }

// // Insert into DOM
// $('#excel_table').html(table);
