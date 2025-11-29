const Salary = require('../models/Salary');

// Get all salaries (with optional date filtering)
exports.getSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find().sort({ date: -1 });
    res.render('pages/salaries', {
      title: 'Salaries',
      salaries: salaries,
      user: req.session.user,
      path: '/salaries'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// Add a new salary
exports.addSalary = async (req, res) => {
  try {
    const { employeeName, amount, type, date, notes } = req.body;
    const newSalary = new Salary({
      salaryId: `SAL${Date.now()}`,
      employeeName,
      amount,
      type,
      date: date || new Date(),
      notes,
      recordedBy: req.session.user.name
    });
    await newSalary.save();
    res.redirect('/salaries');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// Delete a salary
exports.deleteSalary = async (req, res) => {
  try {
    await Salary.findOneAndDelete({ salaryId: req.params.id });
    res.redirect('/salaries');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};
