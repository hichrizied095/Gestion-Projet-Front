using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GestionProjet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TaskItemsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TaskItemsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ✅ NOUVEAU: GET: api/TaskItems/calendar/{userId}
        // Récupère les tâches filtrées selon le rôle de l'utilisateur
        [HttpGet("calendar/{userId}")]
        public async Task<ActionResult<IEnumerable<TaskItem>>> GetCalendarTasks(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "Utilisateur non trouvé" });
            }

            var role = user.Role;
            IQueryable<TaskItem> query;

            if (role == "Admin")
            {
                // ✅ Admin voit TOUTES les tâches de TOUS les projets
                query = _context.TaskItems
                    .Include(t => t.AssignedUser)
                    .Include(t => t.Column)
                        .ThenInclude(c => c.Project);
            }
            else if (role == "ChefDeProjet")
            {
                // ✅ Chef de projet voit :
                // 1. Toutes les tâches de SES projets (dont il est propriétaire)
                // 2. Ses tâches assignées dans d'autres projets
                
                var projectIds = await _context.Projects
                    .Where(p => p.OwnerId == userId)
                    .Select(p => p.Id)
                    .ToListAsync();

                query = _context.TaskItems
                    .Include(t => t.AssignedUser)
                    .Include(t => t.Column)
                        .ThenInclude(c => c.Project)
                    .Where(t =>
                        projectIds.Contains(t.Column.ProjectId) ||  // Tâches de ses projets
                        t.AssignedUserId == userId                   // Ses tâches assignées
                    );
            }
            else
            {
                // ✅ Membre voit uniquement SES tâches assignées
                query = _context.TaskItems
                    .Include(t => t.AssignedUser)
                    .Include(t => t.Column)
                        .ThenInclude(c => c.Project)
                    .Where(t => t.AssignedUserId == userId);
            }

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
                    ProjectId = t.Column.ProjectId,
                    ProjectTitle = t.Column.Project.Title,
                    t.DelayReason,
                    t.Progress
                })
                .ToListAsync();

            return Ok(tasks);
        }
    }
}
