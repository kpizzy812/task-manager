import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Cached function to get current user - deduplicated per request
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

// Cached function to get current profile - deduplicated per request
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  });

  return profile;
});

// Cached function to check project access - deduplicated per request per projectId
export const checkProjectAccess = cache(
  async (projectId: string, userId: string) => {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      select: { id: true },
    });

    return !!project;
  }
);

// Cached function to get project with access check
export const getProjectWithAccess = cache(async (projectId: string) => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
      _count: {
        select: { tasks: true },
      },
    },
  });

  return project;
});
