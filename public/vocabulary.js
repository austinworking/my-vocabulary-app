// Vocabulary data structure (modify as needed)
let vocabulary = [];

// Global variables for pagination
let currentPage = 1;
const rowsPerPage = 10;

// Function to generate unique IDs
function generateUniqueId() {
  return uuid.v4(); // Simple but not very secure, consider using UUIDs for better security
}

// Function to add a new word to the table and update pagination
async function addRow(word) {
  try {
    await fetch('https://83bf-36-82-177-245.ngrok-free.app/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(word)
    });
    vocabulary.push(word);
    updateTable();
    updatePagination();
  } catch (error) {
    console.error('Error adding word:', error);
  }
}

// Function to handle search
function searchTable() {
  const query = $('#search-bar').val().trim().toLowerCase();

  if (query === '') {
    // If the search bar is cleared, fetch all words
    fetchWords();
  } else {
    // Otherwise, fetch search results
    fetch(`https://83bf-36-82-177-245.ngrok-free.app/search?query=${query}`)
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            console.error('Response error:', text);
            throw new Error(`HTTP error! Status: ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        vocabulary = data;
        currentPage = 1;
        updateTable();
        updatePagination();
      })
      .catch(error => {
        console.error('Error fetching search results:', error);
      });
  }
}

// Attach search input event handler
$('#search-bar').on('input', searchTable);

// Function to render the table for the current page
function updateTable() {
  const tableBody = $('#tests-table');
  tableBody.empty(); // Clear the table before adding rows

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  const wordsToDisplay = vocabulary.slice(start, end);
  wordsToDisplay.forEach((word) => {
    const actionCell = `
      <td>
        <button class="btn btn-sm btn-danger" data-id="${word.id}" id="delete-${word.id}">Delete</button>
        <button class="btn btn-sm btn-info" data-id="${word.id}" id="edit-${word.id}">Edit</button>
      </td>
    `;

    const row = `<tr scope="row" class="word-row-${word.id}">
      <td class="english-word sticky-col">${word.englishWord}</td>
      <td class="indonesian-word">${word.indonesianWord}</td>
      <td class="word-class">${word.wordClass}</td>
      <td class="verb2">${word.verb2 ? word.verb2 : ''}</td>
      <td class="verb3">${word.verb3 ? word.verb3 : ''}</td>
      ${actionCell}
    </tr>`;

    tableBody.append(row);

    // Add click event handlers for edit and delete buttons
    $(`#delete-${word.id}`).on('click', function () {
      deleteWord(word.id);
    });
    $(`#edit-${word.id}`).on('click', function () {
      editWord(word.id);
    });
  });
}

// Function to update pagination display and adjust page count after changes
function updatePagination() {
  const totalRows = vocabulary.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  currentPage = Math.min(currentPage, totalPages) || 1; // Ensure currentPage is within bounds

  $('#pageInfo').text(`Page ${currentPage} of ${totalPages}`);

  // Adjust buttons based on current page
  $('#prevPage').prop('disabled', currentPage <= 1);
  $('#nextPage').prop('disabled', currentPage >= totalPages);
}

// Function to handle selecting a word class
$(document).ready(function () {
  const $wordClass = $('#wordClass');
  const $verb2 = $('#verb2');
  const $verb3 = $('#verb3');

  $wordClass.change(function () {
    const wordClass = $wordClass.val();
    if (wordClass === 'Verb') {
      $verb2.removeClass('visually-hidden');
      $verb3.removeClass('visually-hidden');
    } else {
      $verb2.addClass('visually-hidden');
      $verb3.addClass('visually-hidden');
    }
  });

  $('#vocabulary-form').submit(function (event) {
    event.preventDefault();
    const englishWord = $('#englishWord').val();
    const indonesianWord = $('#indonesianWord').val();
    const wordClass = $wordClass.val();
    const verb2 = $verb2.val();
    const verb3 = $verb3.val();

    if (!englishWord || !indonesianWord || !wordClass) {
      // Show validation modal
      const validationModal = new bootstrap.Modal(document.getElementById('validationModal'));
      validationModal.show();
      return;
    }

    const newWord = {
      id: generateUniqueId(),
      englishWord,
      indonesianWord,
      wordClass,
      verb2,
      verb3
    };

    addRow(newWord);
    $('#vocabulary-form').trigger('reset');
  });

  // Initial fetch of words
  fetchWords();
});

// Alert handling

// Function to display the confirmation prompt and delete the word
function deleteWord(wordId) {
  const deleteConfirmationModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));

  // Show modal
  deleteConfirmationModal.show();

  // Handle confirm delete button click
  document.getElementById('confirmDelete').addEventListener('click', async function () {
    try {
      await fetch(`https://83bf-36-82-177-245.ngrok-free.app/words/${wordId}`, {
        method: 'DELETE'
      });

      vocabulary = vocabulary.filter(w => w.id !== wordId);
      updateTable();
      updatePagination();
    } catch (error) {
      console.error('Error deleting word:', error);
    } finally {
      deleteConfirmationModal.hide();
    }
  });
}


function editWord(wordId) {
  const word = vocabulary.find(w => w.id === wordId);
  const $row = $(`.word-row-${wordId}`);
  const originalContent = $row.html();

  $row.html(`
    <td><input type="text" class="edit-english-word form-control" value="${word.englishWord}"></td>
    <td><input type="text" class="edit-indonesian-word form-control" value="${word.indonesianWord}"></td>
    <td>
      <select class="edit-word-class form-select form-select-sm">
        <option value="Noun" ${word.wordClass === 'Noun' ? 'selected' : ''}>Noun</option>
        <option value="Adjective" ${word.wordClass === 'Adjective' ? 'selected' : ''}>Adjective</option>
        <option value="Verb" ${word.wordClass === 'Verb' ? 'selected' : ''}>Verb</option>
      </select>
    </td>
    <td><input type="text" class="edit-verb2 form-control" value="${word.verb2 ? word.verb2 : ''}"></td>
    <td><input type="text" class="edit-verb3 form-control" value="${word.verb3 ? word.verb3 : ''}"></td>
    <td>
      <button class="save-button btn btn-sm btn-primary">Save</button>
      <button class="cancel-button btn btn-sm btn-secondary">Cancel</button>
    </td>
  `);

  $row.find('.save-button').on('click', async function () {
    const newEnglishWord = $row.find('.edit-english-word').val();
    const newIndonesianWord = $row.find('.edit-indonesian-word').val();
    const newWordClass = $row.find('.edit-word-class').val();
    const newVerb2 = $row.find('.edit-verb2').val();
    const newVerb3 = $row.find('.edit-verb3').val();

    if (!newEnglishWord || !newIndonesianWord || !newWordClass) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      // Send a PUT request to update the word in the database
      await fetch(`https://83bf-36-82-177-245.ngrok-free.app/words/${wordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          englishWord: newEnglishWord,
          indonesianWord: newIndonesianWord,
          wordClass: newWordClass,
          verb2: newVerb2,
          verb3: newVerb3
        })
      });

      // Update the word in the local vocabulary array
      const index = vocabulary.findIndex(w => w.id === wordId);
      if (index !== -1) {
        vocabulary[index] = {
          id: wordId,
          englishWord: newEnglishWord,
          indonesianWord: newIndonesianWord,
          wordClass: newWordClass,
          verb2: newVerb2,
          verb3: newVerb3
        };
      }

      // Restore the row content with updated values
      $row.html(`
        <td>${newEnglishWord}</td>
        <td>${newIndonesianWord}</td>
        <td>${newWordClass}</td>
        <td>${newVerb2 ? newVerb2 : ''}</td>
        <td>${newVerb3 ? newVerb3 : ''}</td>
        <td>
          <button id="delete-${wordId}" class="btn btn-sm btn-danger">Delete</button>
          <button id="edit-${wordId}" class="btn btn-sm btn-info">Edit</button>
        </td>
      `);

      attachEventListeners(wordId); // Reattach event listeners for edit and delete buttons
    } catch (error) {
      console.error('Error updating word:', error);
      alert('Failed to update the word.');
    }
  });

  $row.find('.cancel-button').on('click', function () {
    $row.html(originalContent);
    attachEventListeners(wordId);
  });
}

// Attach event listeners for edit and delete buttons
function attachEventListeners(wordId) {
  $(`#delete-${wordId}`).on('click', function () {
    deleteWord(wordId);
  });
  $(`#edit-${wordId}`).on('click', function () {
    editWord(wordId);
  });
}

// Fetch all words and update table and pagination
async function fetchWords() {
  try {
    const response = await fetch('https://83bf-36-82-177-245.ngrok-free.app/words');
    if (!response.ok) throw new Error('Network response was not ok');
    vocabulary = await response.json();
    currentPage = 1; // Reset to first page
    updateTable();
    updatePagination();
  } catch (error) {
    console.error('Error fetching words:', error);
  }
}

// Pagination functions
function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    updateTable();
    updatePagination();
  }
}

function nextPage() {
  const totalPages = Math.ceil(vocabulary.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    updateTable();
    updatePagination();
  }
}

// Initial display call
$(document).ready(function () {
  fetchWords();
});
