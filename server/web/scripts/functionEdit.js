$('#language').val(language);

var tag = $('#tag');
if (working) {
  tag.removeClass('is-danger');
  tag.removeClass('is-light');
  tag.addClass('is-success');
  tag.html('Test Passed')
}

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.setOptions({
  enableBasicAutocompletion: true,
  enableSnippets: true,
  enableLiveAutocompletion: true
});
switch (language) {
  case 'node':
    editor.getSession().setMode("ace/mode/javascript");
    break;
  case 'java':
    editor.getSession().setMode("ace/mode/java");
    break;
  case 'python':
    editor.getSession().setMode("ace/mode/python");
    break;
}
$('#language').on('change', function() {
  var language = $(this).find(":selected").val();
  $.get('/api/function/template/' + language,function(response) {
    editor.setValue(response);
    switch(language) {
      case 'node':
        editor.getSession().setMode("ace/mode/javascript");
        break;
      case 'java':
        editor.getSession().setMode("ace/mode/java");
        break;
      case 'python':
        editor.getSession().setMode("ace/mode/python");
        break;
    }
  });
});
editor.setShowPrintMargin(false);

$('#run').click(function() {
  if(!$('#language').val()) {
    $('#console').val('Please select a language');
    failureAlert('Please select a language');
    return;
  }
  if(!$('#inputs').val()) {
    $('#console').val('Please provide at lease one input');
    failureAlert('Please provide at lease one input');
    return;
  }
  if(!editor.getValue()) {
    $('#console').val('Function can not be blank');
    failureAlert('Function can not be blank');
    return;
  }
  var button = $('#run');
  var tag = $('#tag');
  $('#console').val('');
  button.addClass('is-loading');
  tag.removeClass('is-danger');
  tag.removeClass('is-success');
  tag.addClass('is-light');
  tag.html('Running')
  var language = $('#language').val();
  var code = editor.getValue();
  var inputs = JSON.stringify($('#inputs').val().split('\n'));
  var data = language + ' ' + inputs + '\n' + code;
  var done = false;
  $.ajax({
    type: 'POST',
    url: '/api/function/run',
    dataType: 'text',
    data: data,
    headers: {'Content-Type':'text/plain'},
    success: function (response) {
      done = true;
      tag.removeClass('is-light');
      $('#console').val(response);
      var outputs = $('#outputs').val().split('\n');
      var functionOutputs = response.split('\n').slice(0,-1);
      if(JSON.stringify(functionOutputs) == JSON.stringify(outputs)) {
        tag.addClass('is-success');
        tag.html('Test Passed');
      } else {
        tag.addClass('is-danger');
        tag.html('Test Failed');
      }
      button.removeClass('is-loading');
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      done = true;
      tag.addClass('is-danger');
      tag.html('Test Failed');
      $('#console').val(textStatus);
      button.removeClass('is-loading');
    }
  });
  setTimeout(function () {
    if(!done){
      tag.addClass('is-danger');
      tag.html('Test Failed');
      button.removeClass('is-loading');
      $('#console').val('Process timed out');
    }
  },8000);
});

$('#create').click( function() {
  if(!$('#language').val()) {
    $('#console').val('Please select a language');
    failureAlert('Please select a language');
    return;
  }
  if(!$('#inputs').val()) {
    $('#console').val('Please provide at lease one input');
    failureAlert('Please provide at lease one input');
    return;
  }
  if(!editor.getValue()) {
    $('#console').val('Function can not be blank');
    failureAlert('Function can not be blank');
    return;
  }
  if(!$('#name').val()) {
    $('#console').val('Please add a Function Name');
    failureAlert('Please add a Function Name');
    return;
  }

  if ($('#language').val()) {
    language = $('#language').val();
  }
  var data = {
    name: $('#name').val(),
    language: $('#language').val(),
    inputs: JSON.stringify($('#inputs').val().split('\n')),
    outputs: JSON.stringify($('#outputs').val().split('\n')),
    code: JSON.stringify(editor.getValue().split('\n')),
    _id: id
  };
  $.ajax({
    type: 'PUT',
    url: '/api/function',
    data: data,
    dataType: 'json',
    success: function(response) {
      window.location.pathname = '/function';
    },
    error: function(response) {
      failureAlert(response.responseJSON.result.message);
    }
  });

});

$('#remove').click( function() {
  // Show an alert box confirming if they are sure
  if (confirm('Are you sure you want to delete this function?')) {

    $.ajax({
      type: 'DELETE',
      url: '/api/function/delete',
      data: {_id: id},
      dataType: 'json',
      fail: function() {
        console.log('it failed');
      },
      success: function(response) {
        window.location.pathname = '/function';
      }
    })
  }
});
