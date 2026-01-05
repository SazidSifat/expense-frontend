'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { login as loginApi } from '@/lib/api';
import { Wallet, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupIcon } from '@/components/ui/input-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(1, {
    message: 'Password is required.',
  }),
});

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError('');
    setIsLoading(true);

    try {
      const response = await loginApi(values.email, values.password);
      const { token, user } = response.data.data;
      login(token, user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFEAD3] via-[#FFF5ED] to-[#FFFAF5] dark:from-[#1A1212] dark:via-[#2D1F1F] dark:to-[#1A1212] p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#EA7B7B] rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#D25353] rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9E3B3B] rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#9E3B3B] via-[#D25353] to-[#EA7B7B] rounded-2xl shadow-2xl shadow-[#D25353]/30 mb-4">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text">
            ExpenseTracker
          </h1>
          <p className="text-muted-foreground mt-2">
            Sign in to manage your expenses
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm border border-destructive/20">
                    {error}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupIcon>
                            <Mail />
                          </InputGroupIcon>
                          <Input
                            placeholder="Enter your email"
                            className="pl-14 h-12 rounded-xl border-border/50 bg-background/50 focus:ring-primary"
                            style={{ paddingLeft: '3.5rem' }}
                            {...field}
                          />
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupIcon>
                            <Lock />
                          </InputGroupIcon>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            className="pl-14 h-12 rounded-xl border-border/50 bg-background/50 focus:ring-primary"
                            style={{ paddingLeft: '3.5rem' }}
                            {...field}
                          />
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-[#9E3B3B] via-[#D25353] to-[#EA7B7B] hover:from-[#8A3232] hover:via-[#C24A4A] hover:to-[#E06E6E] text-white rounded-xl font-semibold shadow-lg shadow-[#D25353]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#D25353]/30"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Demo credentials */}
            {/* <div className="mt-6 p-4 bg-accent/50 rounded-xl border border-border/50">
              <p className="text-sm font-medium text-foreground mb-2">Demo Accounts:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><strong className="text-foreground">Admin:</strong> admin@expense.com / password123</p>
                <p><strong className="text-foreground">User 2:</strong> user2@expense.com / password123</p>
                <p><strong className="text-foreground">User 3:</strong> user3@expense.com / password123</p>
              </div>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
