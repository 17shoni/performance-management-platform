import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Header from '../components/Header';
import api from '../services/api';
import { toast } from 'react-toastify';

function Ratings() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState('');

  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchCompletedTasks = async () => {
      try {
        const res = await api.get('tasks/');
        const unrated = res.data.filter(
          (t) =>
            t.status === 'completed' &&
            !t.ratings?.some((r) => r.rated_by === 'current_user')
        );
        setTasks(unrated);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCompletedTasks();
  }, []);

  const handleRate = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      await api.post('ratings/', {
        task: selectedTask.id,
        rating,
        comment,
      });

      navigate('/tasks'); 

    } catch (err) {
      const data = err.response?.data;
      
       if (Array.isArray(data)) {
        alert(data[0]); 
      } else {
        alert('Failed to submit rating, task already rated');
      }

    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Rate Completed Tasks
        </h1>

        {tasks.length === 0 ? (
          <p className="text-gray-600 text-center py-10">
            No completed tasks to rate yet
          </p>
        ) : (
          <div className="space-y-6">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-6 rounded-xl shadow border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{task.title}</h3>
                    <p className="text-gray-600 mt-1">{task.description}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Employee: {task.employee} • Completed:{' '}
                      {new Date(task.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                  >
                    Rate Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full">
              <h2 className="text-2xl font-bold mb-6">
                Rate Task: {selectedTask.title}
              </h2>
              <form onSubmit={handleRate} className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Rating (1–5)
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full p-3 border rounded-lg"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} stars
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 border rounded-lg h-32"
                    placeholder="Your feedback..."
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                  >
                    Submit Rating
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Ratings;
