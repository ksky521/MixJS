<?php

$time = isset($_GET['time'])?intval($_GET['time']):3;

$arr = array(
		'code'=>0,
		'msg'=>'time '.$time.' success'
	);

sleep($time);

echo json_encode($arr);