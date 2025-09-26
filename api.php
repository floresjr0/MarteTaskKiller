<?php
require 'config.php';

header('Content-Type: application/json');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

function json_response($data) {
    echo json_encode($data);
    exit;
}

switch ($action) {

# -------------------------
# SUBJECTS
# -------------------------
case 'add_subject':
    $name = trim($_POST['name'] ?? '');
    if (!$name) json_response(['error'=>'Subject name required']);
    $stmt = $mysqli->prepare("INSERT INTO subjects (name) VALUES (?)");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    json_response(['id'=>$stmt->insert_id, 'name'=>$name]);
    break;

case 'get_subjects':
    $res = $mysqli->query("SELECT id, name FROM subjects ORDER BY name");
    $subjects = $res->fetch_all(MYSQLI_ASSOC);
    json_response($subjects);
    break;

case 'delete_subject':
    $id = intval($_POST['id'] ?? 0);
    if ($id>0) {
        $mysqli->query("DELETE FROM subjects WHERE id={$id}");
        json_response(['ok'=>true]);
    }
    json_response(['error'=>'Invalid subject id']);
    break;

# -------------------------
# TASKS
# -------------------------
case 'add_task':
    $title = trim($_POST['title'] ?? '');
    $subject_id = intval($_POST['subject_id'] ?? 0);
    $due = $_POST['due'] ?? null;
    if (!$title || !$subject_id || !$due) json_response(['error'=>'Title, subject, and due required']);
    $stmt = $mysqli->prepare("INSERT INTO tasks (subject_id,title,due) VALUES (?,?,?)");
    $stmt->bind_param("iss", $subject_id, $title, $due);
    $stmt->execute();
    json_response(['id'=>$stmt->insert_id]);
    break;

case 'get_tasks':
    $res = $mysqli->query("SELECT t.id, t.title, t.due, s.name AS subject 
                           FROM tasks t 
                           LEFT JOIN subjects s ON t.subject_id=s.id
                           ORDER BY t.due ASC");
    $tasks = $res->fetch_all(MYSQLI_ASSOC);
    json_response($tasks);
    break;

case 'delete_task':
    $id = intval($_POST['id'] ?? 0);
    if ($id>0) {
        $mysqli->query("DELETE FROM tasks WHERE id={$id}");
        json_response(['ok'=>true]);
    }
    json_response(['error'=>'Invalid task id']);
    break;

# -------------------------
# FALLBACK
# -------------------------
default:
    json_response(['error'=>'Unknown action']);
    break;
}
