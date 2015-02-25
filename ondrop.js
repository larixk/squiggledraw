window.onDrop = function(element, callback) {
  // Prevent default dragover cancelling the drop
  function dragOver(e) {
    e.preventDefault();
    return false;
  }

  // Dropping occured
  function fileDropped(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files,
      reader;
    if (!files || !files.length) {
      return;
    }

    reader = new FileReader();
    reader.onload = function(e) {
      callback(e.target.result);
    };
    reader.readAsDataURL(files[0]);
  }

  // Prepare to allow droppings
  function attachEventListeners(element) {
    element.addEventListener("dragover", dragOver, false);
    element.addEventListener("dragenter", dragOver, false);
    element.addEventListener("drop", fileDropped, false);
  }
  attachEventListeners(element);
};
