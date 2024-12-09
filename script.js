    const todoInput = document.getElementById('todo-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const todoList = document.getElementById('todo-list');
    const allTasksBtn = document.getElementById('all-tasks-btn');
    const completedTasksBtn = document.getElementById('completed-tasks-btn');
    const incompleteTasksBtn = document.getElementById('incomplete-tasks-btn');

    const LOCAL_STORAGE_KEY = 'todoList';

    let todos = [];
    let timers = {}; 

    window.onload = async () => {
        todos = loadFromLocalStorage() || [];
        if (!todos.length) {
            const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
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
    };

    addTaskBtn.addEventListener('click', () => addTodo());
    allTasksBtn.addEventListener('click', () => renderTodos());
    completedTasksBtn.addEventListener('click', () => renderTodos('completed'));
    incompleteTasksBtn.addEventListener('click', () => renderTodos('incomplete'));

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
        todoInput.value = '';
    }

    function toggleComplete(id) {
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
        const todo = todos.find(todo => todo.id === id);

        if (todo.reminderTimeout) {
            clearTimeout(todo.reminderTimeout);
        }

        todos = todos.filter(todo => todo.id !== id);
        saveToLocalStorage();
        renderTodos();
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
            return true; // 'all'
        });

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