// ✅ CORRECTION - Remplacer la méthode GetCalendarTasks dans TaskItemsController.cs

[HttpGet("calendar/{userId}")]
public async Task<ActionResult<IEnumerable<object>>> GetCalendarTasks(int userId)
{
    try
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return NotFound(new { error = "Utilisateur non trouvé" });

        var role = user.Role;
        IQueryable<TaskItem> query;

        if (role == "Admin")
        {
            // ✅ Admin voit toutes les tâches
            query = _context.Tasks
                .Include(t => t.AssignedUser)
                .Include(t => t.Column)
                    .ThenInclude(c => c.Project);
        }
        else if (role == "ChefDeProjet")
        {
            // ✅ Chef de projet voit ses projets + tâches assignées
            var projectIds = await _context.Projects
                .Where(p => p.OwnerId == userId)
                .Select(p => p.Id)
                .ToListAsync();

            query = _context.Tasks
                .Include(t => t.AssignedUser)
                .Include(t => t.Column)
                    .ThenInclude(c => c.Project)
                .Where(t =>
                    projectIds.Contains(t.Column.ProjectId) ||
                    t.AssignedUserId == userId
                );
        }
        else
        {
            // ✅ Membre voit uniquement ses tâches
            query = _context.Tasks
                .Include(t => t.AssignedUser)
                .Include(t => t.Column)
                    .ThenInclude(c => c.Project)
                .Where(t => t.AssignedUserId == userId);
        }

        // ✅ IMPORTANT: Mapper vers un objet anonyme pour réduire la taille
        var tasks = await query
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.Description,
                t.Percentage,
                t.ColumnId,
                t.IsCompleted,
                t.StartDate,
                t.DueDate,
                t.FilePath,
                t.AssignedUserId,
                AssignedUserName = t.AssignedUser != null ? t.AssignedUser.Username : null,
                ProjectId = t.Column != null ? t.Column.ProjectId : 0,
                ProjectTitle = t.Column != null && t.Column.Project != null ? t.Column.Project.Title : "Sans projet",
                t.DelayReason
            })
            .ToListAsync();

        Console.WriteLine($"✅ Calendrier: {tasks.Count} tâches chargées pour {user.Username} (rôle: {role})");

        return Ok(tasks);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Erreur GetCalendarTasks: {ex.Message}");
        return StatusCode(500, new
        {
            error = "Erreur lors de la récupération des tâches du calendrier",
            details = ex.Message,
            innerError = ex.InnerException?.Message
        });
    }
}
