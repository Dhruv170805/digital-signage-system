const Template = require('../models/Template');

const getAllTemplates = async (req, res) => {
    try {
        const templates = await Template.find().sort({ name: 1 });
        res.json(templates);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createTemplate = async (req, res) => {
    const { name, layout } = req.body;
    try {
        await Template.create({
            name,
            layout: JSON.stringify(layout)
        });
        
        res.status(201).json({ message: 'Template created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteTemplate = async (req, res) => {
    const { id } = req.params;
    try {
        await Template.findByIdAndDelete(id);
        res.json({ message: 'Template deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllTemplates,
    createTemplate,
    deleteTemplate
};
