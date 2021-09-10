<html class='hide-scroll'>
<head>
<title>Palolo | York University - Past Exams, Course Groups, Tutoring.</title>
 <meta name="description"
        content="Free Past Exams,
                 Course Groups,
                 Tutoring,
                 EECS 2001 Theory of Computation,
                 ADMS 2500 Accounting,
                 MATH 1090 Logic for Computer Science.
                 MATH 1300 Calculus and Applications
                 EECS 2011 Data Structures and Algorithms,
                 EECS 2021 Computer Organization
                 EECS 2031 Software Tools
                 EECS 1012 Net-centric Computing
                 EECS 3311 Software Design
                 PSYC 2021 Statistical Methods I
                 PSYC 2022 Statistical Methods II">
<link rel="shortcut icon" href="./favicon.ico" type="image/x-icon">
<link rel="icon" href="./favicon.ico" type="image/x-icon">
<link rel="stylesheet" href="./assets/bootstrap-3.3.7/css/bootstrap.min.css">
<link rel='stylesheet' href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
<link rel="stylesheet" href="./styles/index/style.css?v=1.2">

<meta
 name="viewport"
 content="width=device-width,
  initial-scale=1,
  maximum-scale=1,
  initial-scale=1,
  user-scalable=no">
<!--        // Copyright Palolo Education Inc. 2020  -->
<?php



 // environment dependant JS loading for testing purposes.
  if(function_exists('apache_getenv')){
    $file = fopen('/var/www/palolo/bin/versioning/app_versions',"r");
    $app_dev = fgets($file);
    $app_live = fgets($file);
    fclose($file);
    $context = apache_getenv('SERVER_CONTEXT');
    $firstHalf = '<script type="text/javascript" data-main="./';
    $secondHalf = '" src="./assets/require.js" defer="defer"> </script>';
    if($context == 'dev'){
      echo $firstHalf . $app_dev . $secondHalf;
    }
    else if($context == 'live'){
      echo $firstHalf . $app_live . $secondHalf;
    }
  }
?>


</head>
<body>



<div class="container">


  <div id="top-panel"
       class="row no-gutters">
    <banner>
    </banner>
  </div>




  <div id="content-holder" class="row no-gutters">
    <div class="wide-screen-middelizer">

      <!-- centered stuff that is not in the flow. -->
      <auth class="auth-component"></auth>
      <environment> </environment>
      <profile-setter class="profile-setter"></profile-setter>
      <lead-view></lead-view>
      <doc-uploader></doc-uploader>
      <document-plans></document-plans>
      <credit-card-info></credit-card-info>
      <video-chat></video-chat>
      <incoming-call></incoming-call>
      <tutoring-plans></tutoring-plans>
      <forum-poster></forum-poster>


      <div class="left-panel no-padding hidden-xs hidden-sm col-md-3 col-lg-2">
        <search></search>

        <course-groups></course-groups>
        <pal-request-list></pal-request-list>
        <pal-list></pal-list>
        <people-popups></people-popups>
     </div>


     <div id="center_panel" class="no-padding col-xs-12 col-sm-12 col-md-9 col-lg-7">
        <forum-feed></forum-feed>
        <chat-widget class="chat-widget"></chat-widget>
        <blackboard class="blackboard-widget"></blackboard>
        <course-features id="course-component"></course-features>
     </div>

     <div id="right_panel" class="no-padding hidden-xs hidden-sm hidden-md col-lg-3">
           <right-panel></right-panel>
     </div>

      <span id="copy-right">&copy; Palolo Education Inc. 2020</span>
    </div>
  </div>
</div> <!-- container -->
</body>
</html>
