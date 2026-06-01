import { notFound } from "next/navigation";
import { CourseForm } from "@/components/admin/course-form";
import { getCourseByIdAction } from "@/app/actions/course-actions";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseByIdAction(id);
  if (!course) notFound();

  return <CourseForm mode="edit" courseId={id} initialData={course} />;
}
