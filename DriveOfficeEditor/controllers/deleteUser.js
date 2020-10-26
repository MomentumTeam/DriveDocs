exports.deleteUserFromSession = (id, user) => {
    try {
        await redis.removeUserFromSession(id, user);
    } catch (e) {
        logger.log({
          level: "error",
          message: `Status 500, failed to remove user from session, error: ${e}`,
          label: `session: ${id} user: ${user}`,
        });
        res.status(500).send(e);
    }
}