const todoInput = document.getElementById('todo-input');
const addTaskBtn = document.getElementById('add-task-btn');
const todoList = document.getElementById('todo-list');
const allTasksBtn = document.getElementById('all-tasks-btn');
const completedTasksBtn = document.getElementById('completed-tasks-btn');
const incompleteTasksBtn = document.getElementById('incomplete-tasks-btn');
const deleteAllTasksBtn = document.getElementById('delete-all-tasks-btn'); 

const LOCAL_STORAGE_KEY = 'todoList';

let todos = [];
let timers = {}; 

window.onload = async () => {
    try {
        displayLoadingMessage(); 
        todos = loadFromLocalStorage() || [];

        if (!todos.length) {
            const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
            if (!response.ok) throw new Error('Failed to fetch tasks from the server.');

            const data = await response.json();
            todos = data.map(todo => ({
                id: todo.id,
                text: todo.title,
                completed: todo.completed,
                reminder: false,
                reminderTimeout: null, 
            }));
            saveToLocalStorage();
        }

        renderTodos();
        setActiveButton('all');
        focusOnInputIfEmpty(); 
    } catch (error) {
        console.error('Error loading tasks:', error);
        alert('Ошибка загрузки задач. Попробуйте обновить страницу позже.');
    }
};

addTaskBtn.addEventListener('click', () => addTodo());
allTasksBtn.addEventListener('click', () => {
    renderTodos();
    setActiveButton('all');
});
completedTasksBtn.addEventListener('click', () => {
    renderTodos('completed');
    setActiveButton('completed');
});
incompleteTasksBtn.addEventListener('click', () => {
    renderTodos('incomplete');
    setActiveButton('incomplete');
});
deleteAllTasksBtn.addEventListener('click', () => deleteAllTodos()); 

function displayLoadingMessage() {
    todoList.innerHTML = '<p class="loading-message">Загрузка...</p>';
}

function focusOnInputIfEmpty() {
    if (todos.length === 0) {
        todoInput.focus();
    }
}

function setActiveButton(filter) {
    allTasksBtn.classList.remove('active');
    completedTasksBtn.classList.remove('active');
    incompleteTasksBtn.classList.remove('active');

    if (filter === 'all') {
        allTasksBtn.classList.add('active');
    } else if (filter === 'completed') {
        completedTasksBtn.classList.add('active');
    } else if (filter === 'incomplete') {
        incompleteTasksBtn.classList.add('active');
    }
}

function addTodo() {
    const taskText = todoInput.value.trim();
    if (!taskText) return alert('Введите текст задачи!');
    const newTodo = {
        id: Date.now(),
        text: taskText,
        completed: false,
        reminder: false,
        reminderTimeout: null,
    };
    todos.push(newTodo);
    saveToLocalStorage();
    renderTodos();
    setActiveButton('all');
    todoInput.value = '';
}

function toggleComplete(id) {
    if (todos.length === 0) return;

    const todo = todos.find(todo => todo.id === id);
    todo.completed = !todo.completed;

    if (todo.completed && todo.reminderTimeout) {
        clearTimeout(todo.reminderTimeout);
        todo.reminder = false;
        todo.reminderTimeout = null;
    }

    saveToLocalStorage();
    renderTodos();
}

function deleteTodo(id) {
    if (todos.length === 0) return; 

    const todo = todos.find(todo => todo.id === id);

    if (todo.reminderTimeout) {
        clearTimeout(todo.reminderTimeout);
    }

    todos = todos.filter(todo => todo.id !== id);
    saveToLocalStorage();
    renderTodos();
}

function deleteAllTodos() {
    if (todos.length === 0) return alert('Нет задач для удаления.');

    if (confirm('Вы уверены, что хотите удалить все задачи?')) {
        todos.forEach(todo => {
            if (todo.reminderTimeout) {
                clearTimeout(todo.reminderTimeout);
            }
        });
        todos = [];
        saveToLocalStorage();
        renderTodos();
    }
}

function setReminder(id) {
    const todo = todos.find(todo => todo.id === id);

    if (todo.completed) {
        return alert('Задача уже выполнена. Напоминание недоступно.');
    }

    const seconds = prompt('Укажите время для напоминания (в секундах):');
    if (!seconds || isNaN(seconds) || seconds <= 0) {
        return alert('Введите корректное число секунд!');
    }

    todo.reminder = true;

    if (todo.reminderTimeout) {
        clearTimeout(todo.reminderTimeout);
    }

    todo.reminderTimeout = setTimeout(() => {
        alert(`Напоминание о задаче: "${todo.text}"`);
        todo.reminder = false; 
        todo.reminderTimeout = null;
        saveToLocalStorage();
        renderTodos();
    }, seconds * 1000);

    saveToLocalStorage();
    renderTodos();
}

function renderTodos(filter = 'all') {
    todoList.innerHTML = '';
    const filteredTodos = todos.filter(todo => {
        if (filter === 'completed') return todo.completed;
        if (filter === 'incomplete') return !todo.completed;
        return true; 
    });

    if (filteredTodos.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'Нет задач';
        emptyMessage.classList.add('empty-message');
        todoList.appendChild(emptyMessage);
        focusOnInputIfEmpty(); 
        return;
    }

    filteredTodos.forEach(todo => {
        const todoItem = document.createElement('li');
        todoItem.classList.add('todo-item');
        if (todo.completed) todoItem.classList.add('completed');

        todoItem.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleComplete(${todo.id})">
            <span>${todo.text}</span>
            ${
                !todo.completed
                    ? `<button class="reminder-btn" onclick="setReminder(${todo.id})">${todo.reminder ? '🔔' : '⏰'}</button>`
                    : ''
            }
            <button class="delete-btn" onclick="deleteTodo(${todo.id})">Удалить</button>
        `;

        todoList.appendChild(todoItem);
    });
}

function saveToLocalStorage() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(todos));
}

function loadFromLocalStorage() {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
}
